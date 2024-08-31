import copy
import httpx
from typing import Optional

API_BASE = "https://api.openai.com/v1/chat/completions"


def build_params(prompt: str, response_format: Optional[dict] = None):
    payload = {}
    payload["messages"] = [
        {"role": "user", "content": [{"type": "text", "text": prompt}]}
    ]
    if response_format:
        payload["response_format"] = copy.deepcopy(response_format)
    return payload


class OpenAICompletion:
    def __init__(self, api_key, model):
        self.api_key = api_key
        self.model = model

    async def completion(
        self,
        prompt,
        response_format: Optional[dict] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        tracker: Optional[dict] = None,
    ):
        params = build_params(prompt=prompt, response_format=response_format)
        if model:
            params["model"] = model
        else:
            params["model"] = self.model
        headers = {}
        if api_key:
            headers["Authorization"] = "Bearer {}".format(api_key)
        else:
            headers["Authorization"] = "Bearer {}".format(self.api_key)

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(API_BASE, json=params, headers=headers)
            resp.raise_for_status()

        data = resp.json()
        completion = data["choices"][0]["message"]["content"]
        return completion
