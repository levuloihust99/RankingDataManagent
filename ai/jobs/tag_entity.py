import os
import json
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv(override=True)

import urllib.parse
import motor.motor_asyncio

from lib.logging import do_setup_logging
from lib.llm.openai import OpenAICompletion

do_setup_logging(level=logging.INFO)
logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = r'''Trích xuất thực thể từ đoạn văn sau. Trả lời dưới dạng JSON: {"entities": [{"value": ...}]}
"""
%s
"""'''

BATCH_SIZE = 10


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
        except:
            logger.error("Encounter error", exc_info=True)
            return None

    return wrapper


def align_entities(text: str, entities: list[dict]) -> list[dict]:
    aligned_entities = []
    offset = 0
    for entity in entities:
        value = entity["value"]
        try:
            start = text.index(value)
            end = start + len(value)
            aligned_entities.append(
                {"value": value, "start": start + offset, "end": end + offset}
            )
            offset += len(text[:end])
            text = text[end:]
        except:
            logger.error("Entity not found")
            continue
    return aligned_entities


async def batch_align(align_jobs: list[dict]):
    collection = getattr(asyncio.get_running_loop(), "collection")
    for job in align_jobs:
        context = {
            "sample_id": job["sample_id"],
            "loop_idx": job["loop_idx"],
            "comp_idx": job["comp_idx"],
            "positive_idx": job["positive_idx"],
        }
        if job["completion"] is None:
            logger.warning("Skip tagging entity: {}".format(json.dumps(context)))
            continue
        try:
            entities = json.loads(job["completion"])["entities"]
            aligned_entities = align_entities(job["positive_content"], entities)
            await collection.find_one_and_update(
                {"sampleId": job["sample_id"]},
                {
                    "$set": {
                        "comparisons.{}.positives.{}.entities".format(
                            job["comp_idx"], job["positive_idx"]
                        ): aligned_entities
                    }
                },
            )
            logger.info("Done tagging entity: {}".format(json.dumps(context)))
        except:
            logger.error(
                "Error tagging entity: {}".format(json.dumps(context)),
                exc_info=True,
            )
            continue


async def launch():
    llm = OpenAICompletion(api_key=get_env("OPENAI_API_KEY"), model="gpt-4o-mini")
    completion_func = auto_handle_error(llm.completion)
    db_client = setup_db()
    collection = db_client[get_env("MONGO_SCHEMA")][get_env("MONGO_COLLECTION")]
    cursor = collection.find({})
    setattr(asyncio.get_running_loop(), "collection", collection)

    jobs = []
    idx = -1
    async for doc in cursor:
        idx += 1
        for i in range(len(doc["comparisons"])):
            positives = doc["comparisons"][i]["positives"]
            for j, positive in enumerate(positives):
                if not positive.get("entities"):
                    jobs.append(
                        {
                            "sample_id": doc["sampleId"],
                            "loop_idx": idx,
                            "comp_idx": i,
                            "positive_idx": j,
                            "positive_content": positive["content"],
                            "task": asyncio.create_task(
                                completion_func(
                                    PROMPT_TEMPLATE % positive["content"],
                                    response_format={"type": "json_object"},
                                )
                            ),
                        }
                    )
                    if len(jobs) == BATCH_SIZE:
                        completions = await asyncio.gather(
                            *[job["task"] for job in jobs]
                        )
                        post_jobs = []
                        for job_detail, completion in zip(jobs, completions):
                            post_jobs.append(
                                {
                                    "sample_id": job_detail["sample_id"],
                                    "loop_idx": job_detail["loop_idx"],
                                    "comp_idx": job_detail["comp_idx"],
                                    "positive_idx": job_detail["positive_idx"],
                                    "positive_content": job_detail["positive_content"],
                                    "completion": completion,
                                }
                            )
                        await batch_align(post_jobs)
                        jobs = []

    if len(jobs) > 0:
        completions = await asyncio.gather(*[job["task"] for job in jobs])
        post_jobs = []
        for job_detail, completion in zip(jobs, completions):
            post_jobs.append(
                {
                    "sample_id": job_detail["sample_id"],
                    "loop_idx": job_detail["loop_idx"],
                    "comp_idx": job_detail["comp_idx"],
                    "positive_idx": job_detail["positive_idx"],
                    "positive_content": job_detail["positive_content"],
                    "completion": completion,
                }
            )
        await batch_align(post_jobs)


def main():
    asyncio.run(launch())


if __name__ == "__main__":
    main()
