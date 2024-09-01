import os
import re
import json
import httpx
import asyncio
import logging
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

import urllib.parse
import motor.motor_asyncio

from lib.logging import do_setup_logging
from lib.llm.openai import OpenAICompletion

do_setup_logging(level=logging.INFO)
logger = logging.getLogger(__name__)

prompt_path = Path(__file__).parent / "prompts" / "templates" / "invalidate-entity.txt"
with prompt_path.open("r", encoding="utf-8") as reader:
    PROMPT_TEMPLATE = reader.read()


BATCH_SIZE = 1


def get_env(env_var):
    try:
        return os.environ[env_var]
    except:
        return None


def setup_db():
    username = get_env("MONGO_USERNAME")
    password = get_env("MONGO_PASSWORD")
    if username and password:
        db_auth = "{}:{}@".format(
            urllib.parse.quote_plus(username), urllib.parse.quote_plus(password)
        )
    else:
        db_auth = ""
    connection_uri = "mongodb://{}{}:{}".format(
        db_auth, get_env("MONGO_HOST"), get_env("MONGO_PORT")
    )
    logger.info(connection_uri)
    db_client = motor.motor_asyncio.AsyncIOMotorClient(connection_uri)
    return db_client


def auto_handle_error(func):
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except httpx.HTTPStatusError as exc:
            logger.error("Encounter error", exc_info=True)
            raise
        except:
            logger.error("Encounter error", exc_info=True)
            return None

    return wrapper


def extract_entities(text: str):
    matches = re.finditer(r"{(?P<entity>.*?)}", text)
    entities = []
    for idx, match in enumerate(matches):
        entity_start = match.start("entity") - 1 - idx * 2
        entity_end = match.end("entity") - 1 - idx * 2
        entity_value = match.group("entity")
        entities.append(
            {"value": entity_value, "start": entity_start, "end": entity_end}
        )
    out_text = re.sub(r"[{}]", "", text)

    # verify entities
    for entity in entities:
        assert out_text[entity["start"] : entity["end"]] == entity["value"]

    return out_text, entities


async def handle_post_jobs(jobs: list[dict]):
    """Each job should have the following:

    * context: include sample_idx, loop_idx and comp_idx
    * completion: output of LLM
    """

    collection = getattr(asyncio.get_running_loop(), "collection")

    for job in jobs:
        context = job["context"]
        if job["completion"] is None:
            logger.warning(
                "Skip invalidating entities due to LLM error: {}".format(
                    json.dumps(context)
                )
            )
            continue

        try:
            # cache completion for debug
            with open("completion.txt", "w", encoding="utf-8") as writer:
                writer.write(job["completion"])

            matches = re.finditer(
                r"[12345]\.\s+(?P<summary>.*)$", job["completion"], re.MULTILINE
            )
            summaries = [match.group("summary") for match in matches]
            if len(summaries) != 5:
                logger.warning(
                    "Skip invalidating entities due to parse output failed: {}".format(
                        json.dumps(context)
                    )
                )
                continue

            negatives = []
            for i, summary in enumerate(summaries):
                if re.search(r"[{}]", summary):
                    text, entities = extract_entities(summary)
                    negatives.append(
                        {
                            "content": text,
                            "entities": entities,
                            "score": 0,
                            "metadata": {
                                "generator": "Non-conciseness-{}".format(
                                    len(summaries) - i
                                )
                            },
                        }
                    )
                else:
                    negatives.append({"content": summary, "entities": []})

            await collection.find_one_and_update(
                {"sampleId": job["context"]["sample_id"]},
                {
                    "$set": {
                        "comparisons.{}.negatives".format(
                            job["context"]["comp_idx"]
                        ): negatives
                    }
                },
            )
            logger.info("Done invalidating entity: {}".format(json.dumps(context)))
        except:
            logger.error(
                "Error invalidating entity: {}".format(json.dumps(context)),
                exc_info=True,
            )
            # continue
            raise


async def launch(args):
    llm = OpenAICompletion(api_key=get_env("OPENAI_API_KEY"), model=args.model)
    completion_func = auto_handle_error(llm.completion)
    db_client = setup_db()
    collection = db_client[get_env("MONGO_SCHEMA")][get_env("MONGO_COLLECTION")]
    cursor = collection.find({}).skip(args.skip)
    setattr(asyncio.get_running_loop(), "collection", collection)

    jobs = []
    idx = -1
    async for doc in cursor:
        idx += 1
        for i in range(len(doc["comparisons"])):
            context = {
                "sample_id": doc["sampleId"],
                "loop_idx": idx,
                "comp_idx": i,
            }

            negatives = doc["comparisons"][i]["negatives"] or []
            if len(negatives) > 0:
                logger.warning(
                    "Skip invalidating entities due to negatives existed: {}".format(
                        json.dumps(context)
                    )
                )
                continue

            positives = doc["comparisons"][i]["positives"]
            if len(positives) == 0:
                logger.warning("Skip invalidating entities due to empty positives: {}")

            # only handle the first positives
            positive = positives[0]

            if re.search(r"[{}]", positive["content"]):
                logger.warning(
                    "Skip invalidating entities due to curly braces included in text: {}".format(
                        json.dumps(context)
                    )
                )
                continue

            jobs.append(
                {
                    "context": context,
                    "task": asyncio.create_task(
                        completion_func(
                            PROMPT_TEMPLATE.format(
                                document=doc["input"], summary=positive["content"]
                            )
                        )
                    ),
                }
            )

            if len(jobs) == BATCH_SIZE:
                completions = await asyncio.gather(*[job["task"] for job in jobs])
                post_jobs = []
                for job_detail, completion in zip(jobs, completions):
                    post_jobs.append(
                        {
                            "context": job_detail["context"],
                            "completion": completion,
                        }
                    )
                await handle_post_jobs(post_jobs)
                jobs = []
                await asyncio.sleep(20)

    if len(jobs) > 0:
        completions = await asyncio.gather(*[job["task"] for job in jobs])
        post_jobs = []
        for job_detail, completion in zip(jobs, completions):
            post_jobs.append(
                {
                    "context": job_detail["context"],
                    "completion": completion,
                }
            )
        await handle_post_jobs(post_jobs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="gpt-4")
    parser.add_argument("--skip", type=int, default=0)
    args = parser.parse_args()
    asyncio.run(launch(args))


if __name__ == "__main__":
    main()
