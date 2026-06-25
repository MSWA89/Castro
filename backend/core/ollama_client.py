import json
from collections.abc import AsyncIterator
from typing import Any

import ollama
from .config import settings

_client: ollama.AsyncClient | None = None


def get_client() -> ollama.AsyncClient:
    global _client
    if _client is None:
        _client = ollama.AsyncClient(host=settings.ollama_host)
    return _client


async def chat_stream(
    messages: list[dict[str, str]],
    model: str | None = None,
) -> AsyncIterator[str]:
    client = get_client()
    async for chunk in await client.chat(
        model=model or settings.chat_model,
        messages=messages,
        stream=True,
    ):
        token = chunk["message"]["content"]
        if token:
            yield token


async def chat_complete(
    messages: list[dict[str, str]],
    model: str | None = None,
) -> str:
    client = get_client()
    response = await client.chat(
        model=model or settings.chat_model,
        messages=messages,
        stream=False,
    )
    return response["message"]["content"]


async def embed(text: str) -> list[float]:
    client = get_client()
    response = await client.embeddings(
        model=settings.embed_model,
        prompt=text,
    )
    return response["embedding"]


async def health_check() -> bool:
    try:
        client = get_client()
        await client.list()
        return True
    except Exception:
        return False
