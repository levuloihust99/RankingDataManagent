import argparse
import asyncio
import json
import httpx
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from contextlib import contextmanager
from lib.llm.openai import OpenAICompletion
from lib.logging import do_setup_logging

do_setup_logging(level=logging.INFO)

load_dotenv(override=True)

import urllib.parse
import motor.motor_asyncio
import google.generativeai as genai

logger = logging.getLogger(__name__)
gemini = genai.GenerativeModel("gemini-1.5-pro-exp-0827")


GEMINI_TEMPLATE_PATH = (
    Path(__file__).parent / "prompts" / "templates" / "create-noncoverage.txt"
)
with GEMINI_TEMPLATE_PATH.open("r", encoding="utf-8") as reader:
    template = reader.read()
GPT_4O_MINI_TEMPLATE_PATH = (
    Path(__file__).parent
    / "prompts"
    / "templates"
    / "create-noncoverage-gpt4o-mini.txt"
)
with GPT_4O_MINI_TEMPLATE_PATH.open("r", encoding="utf-8") as reader:
    gpt4o_template = reader.read()
OUTPUT_PATH = "noncoverage.jsonl"

api_keys = []

api_key_idx = {"value": -1}
def get_api_key():
    idx = (api_key_idx["value"] + 1) % len(api_keys)
    api_key_idx["value"] += 1
    return api_keys[idx]


@contextmanager
def file_context():
    fw = open(OUTPUT_PATH, "a", encoding="utf-8")
    globals()["fw"] = fw
    yield
    globals().pop("fw")
    fw.close()


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


async def gemini_generate(prompt: str, **kwargs):
    """Call Gemini API to generate output from a prompt.

    Valid kwargs are:
        api_key
        candidate_count
        stop_sequences
        max_output_tokens
        temperature
        top_p
        top_k

    Return (Text):
        The completion of the prompt.
    """
    api_key = kwargs.pop("api_key", None) or get_env("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    gen_config = genai.types.GenerationConfig(**kwargs)
    try:
        response = await gemini.generate_content_async(
            prompt,
            generation_config=gen_config,
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE",
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE",
                },
            ],
        )
        return response.text
    except Exception as e:
        logger.error("Encounter error", exc_info=True)
        raise


async def job_process(job):
    try:
        if args.model_use == "gpt-4o-mini":
            prompt = gpt4o_template % job["document"]
            completion = await llm.completion(
                prompt=prompt, response_format={"type": "json_object"}, api_key=get_api_key()
            )
        else:
            prompt = template % job["document"]
            completion = await gemini_generate(
                prompt,
                top_p=0.95,
                top_k=64,
                temperature=1.0,
                response_mime_type="application/json",
            )
        fw.write(
            json.dumps(
                {"sampleId": job["context"]["sample_id"], "completion": completion},
                ensure_ascii=False,
            )
            + "\n"
        )
        fw.flush()
        logger.info(
            "Done generating non-coverage: {}".format(json.dumps(job["context"]))
        )
        return True
    except httpx.HTTPStatusError as exc:
        logger.error("Call LLM error", exc_info=True)
        return False
    except:
        logger.error("Call LLM error", exc_info=True)
        return None


async def batch_process(jobs):
    tasks = []
    for job in jobs:
        tasks.append(job_process(job))
    completions = await asyncio.gather(*tasks)
    return completions


async def launch():
    db_client = setup_db()
    collection = db_client[get_env("MONGO_SCHEMA")][get_env("MONGO_COLLECTION")]
    cursor = collection.find({}).sort({"createdAt": 1})
    setattr(asyncio.get_running_loop(), "collection", collection)

    jobs = []
    idx = -1
    async for doc in cursor:
        idx += 1
        context = {
            "sample_id": doc["sampleId"],
            "loop_idx": idx,
        }
        if doc["sampleId"] in existed:
            logger.warning("Skipping {}".format(json.dumps(context)))
            continue
        jobs.append({"context": context, "document": doc["input"]})
        if len(jobs) == args.batch_size:
            results = await batch_process(jobs)
            for r in results:
                if r is False:
                    return
            jobs = []

    if len(jobs) > 0:
        await batch_process(jobs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model_use",
        "-m",
        default="gpt-4o-mini",
        choices=["gpt-4o-mini", "gemini-1.5-pro-exp-0827"],
    )
    parser.add_argument("--batch_size", type=int, default=20)
    global args
    args = parser.parse_args()

    global llm
    llm = OpenAICompletion(api_key=get_env("OPENAI_API_KEY"), model=args.model_use)

    global existed
    existed = set()
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r", encoding="utf-8") as reader:
            for line in reader:
                item = json.loads(line.strip())
                existed.add(item["sampleId"])
    with file_context():
        asyncio.run(launch())


if __name__ == "__main__":
    main()
