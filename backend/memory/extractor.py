"""
Async memory extraction pipeline.

After each assistant response, this fires as a background task.
It asks Claude to surface 1-3 durable facts, stores them in
ChromaDB, and writes them to the Obsidian brain.
"""

from __future__ import annotations

import json
import logging

from ..core.config import settings
from ..core.claude_client import chat_complete
from . import brain

logger = logging.getLogger(__name__)

_EXTRACTION_PROMPT = """\
You are a memory distillation system. Given a conversation exchange, extract \
1 to 3 concise facts that are worth remembering long-term about the user, \
their preferences, or decisions made.

Focus on: user preferences, established facts, technical decisions, \
personal context, recurring themes.

Respond with ONLY valid JSON in this exact format:
{{"memories": ["fact one", "fact two"], "tags": ["tag1", "tag2"]}}

If there is nothing worth remembering, respond: {{"memories": [], "tags": []}}

Exchange:
User: {user_message}
Assistant: {assistant_message}"""


async def extract(
    agent_id: str,
    user_message: str,
    assistant_message: str,
) -> None:
    if not settings.memory_extraction_enabled:
        return

    prompt = _EXTRACTION_PROMPT.format(
        user_message=user_message,
        assistant_message=assistant_message[:500],
    )

    try:
        raw = await chat_complete(
            messages=[{"role": "user", "content": prompt}]
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        memories: list[str] = data.get("memories", [])
        tags: list[str] = data.get("tags", [])

        for memory in memories:
            if memory.strip():
                await brain.store(agent_id, memory.strip(), tags)
                logger.debug("Stored memory for %s: %s", agent_id, memory[:60])

    except (json.JSONDecodeError, KeyError, Exception) as exc:
        logger.warning("Memory extraction failed for agent %s: %s", agent_id, exc)
