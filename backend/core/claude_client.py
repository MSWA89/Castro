from __future__ import annotations

from collections.abc import AsyncIterator

import anthropic

from .config import settings

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def chat_stream(
    messages: list[dict],
    system: str = "",
) -> AsyncIterator[str]:
    client = get_client()
    kwargs: dict = dict(
        model=settings.chat_model,
        max_tokens=settings.max_tokens,
        messages=messages,
    )
    if system:
        kwargs["system"] = system

    async with client.messages.stream(**kwargs) as stream:
        async for text in stream.text_stream:
            yield text


async def chat_complete(
    messages: list[dict],
    system: str = "",
) -> str:
    client = get_client()
    kwargs: dict = dict(
        model=settings.chat_model,
        max_tokens=settings.max_tokens,
        messages=messages,
    )
    if system:
        kwargs["system"] = system

    response = await client.messages.create(**kwargs)
    return response.content[0].text


async def health_check() -> bool:
    try:
        client = get_client()
        await client.messages.create(
            model=settings.chat_model,
            max_tokens=5,
            messages=[{"role": "user", "content": "ping"}],
        )
        return True
    except Exception:
        return False
