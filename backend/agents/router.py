"""
Agent interaction routes.

Learning loop per request:
  1. Retrieve relevant memories from the brain
  2. Build context: [persona] + [memories] + [conversation history] + [user message]
  3. Stream response
  4. After stream: extract and store new memories (background task)
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
import aiosqlite

from ..core.config import settings
from ..core.database import get_db
from ..core.ollama_client import chat_stream, chat_complete
from ..memory import brain, extractor
from ..personas.loader import registry
from .models import (
    AgentRecord,
    AgentState,
    ChatRequest,
    ChatResponse,
    CollaborationRequest,
    CollaborationResult,
    CollaborationTurn,
)
from .session import cache

router = APIRouter(prefix="/agents", tags=["agents"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_messages(
    persona_prompt: str,
    memories: list[str],
    history: list[dict[str, str]],
    user_message: str,
) -> list[dict[str, str]]:
    system_parts = [persona_prompt]
    if memories:
        mem_block = "\n".join(f"- {m}" for m in memories)
        system_parts.append(f"\n\nRelevant memories about this user:\n{mem_block}")

    messages: list[dict[str, str]] = [
        {"role": "system", "content": "\n".join(system_parts)}
    ]
    messages.extend(history[-settings.max_conversation_history :])
    messages.append({"role": "user", "content": user_message})
    return messages


async def _ensure_agent(agent_id: str, persona_id: str, db: aiosqlite.Connection) -> None:
    async with db.execute("SELECT id FROM agents WHERE id = ?", (agent_id,)) as cur:
        row = await cur.fetchone()
    now = time.time()
    if row is None:
        await db.execute(
            "INSERT INTO agents (id, persona_id, created_at, last_active, state) VALUES (?,?,?,?,?)",
            (agent_id, persona_id, now, now, AgentState.loaded),
        )
    else:
        await db.execute(
            "UPDATE agents SET last_active = ?, state = ? WHERE id = ?",
            (now, AgentState.active, agent_id),
        )
    await db.commit()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/{agent_id}/chat")
async def chat(
    agent_id: str,
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
) -> StreamingResponse:
    persona = registry.get(agent_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Agent/persona '{agent_id}' not found")

    await _ensure_agent(agent_id, persona.id, db)
    session = await cache.get(agent_id, persona.id, db)
    memories = await brain.retrieve(agent_id, request.prompt)
    messages = _build_messages(
        persona.system_prompt, memories, session.history, request.prompt
    )

    async def generate() -> AsyncIterator[str]:
        full_response: list[str] = []
        try:
            async for token in chat_stream(messages):
                full_response.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
        finally:
            response_text = "".join(full_response)
            session.add_message("user", request.prompt)
            session.add_message("assistant", response_text)
            session.touch()
            await cache.save(agent_id, db)
            if response_text:
                background_tasks.add_task(
                    extractor.extract, agent_id, request.prompt, response_text
                )
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("", response_model=list[AgentRecord])
async def list_agents(db: aiosqlite.Connection = Depends(get_db)) -> list[AgentRecord]:
    async with db.execute("SELECT * FROM agents ORDER BY last_active DESC") as cur:
        rows = await cur.fetchall()
    return [AgentRecord(**dict(row)) for row in rows]


@router.get("/{agent_id}", response_model=AgentRecord)
async def get_agent(
    agent_id: str, db: aiosqlite.Connection = Depends(get_db)
) -> AgentRecord:
    async with db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return AgentRecord(**dict(row))


@router.delete("/{agent_id}/history", status_code=204)
async def clear_history(
    agent_id: str, db: aiosqlite.Connection = Depends(get_db)
) -> None:
    await db.execute("DELETE FROM messages WHERE agent_id = ?", (agent_id,))
    await db.commit()
    cache._hot.pop(agent_id, None)
    cache._warm.pop(agent_id, None)


@router.get("/{agent_id}/memories")
async def get_memories(agent_id: str) -> list[dict]:
    return await brain.list_memories(agent_id)


# ---------------------------------------------------------------------------
# Collaboration
# ---------------------------------------------------------------------------


@router.post("/collaborate", response_model=CollaborationResult)
async def collaborate(
    request: CollaborationRequest,
    db: aiosqlite.Connection = Depends(get_db),
) -> CollaborationResult:
    for aid in request.agent_ids:
        if not registry.get(aid):
            raise HTTPException(status_code=404, detail=f"Agent '{aid}' not found")

    session_id = str(uuid.uuid4())
    turns: list[CollaborationTurn] = []
    current_content = request.prompt

    for turn_idx in range(request.max_turns):
        agent_id = request.agent_ids[turn_idx % len(request.agent_ids)]
        persona = registry.get(agent_id)

        session = await cache.get(agent_id, persona.id, db)
        memories = await brain.retrieve(agent_id, current_content)

        prior_context = "\n\n".join(
            f"[{request.agent_ids[(i % len(request.agent_ids))]}] {t.content}"
            for i, t in enumerate(turns)
        )
        prompt = (
            f"Original task: {request.prompt}\n\n"
            f"Conversation so far:\n{prior_context}\n\n"
            f"Your turn — continue or resolve:"
            if turns
            else current_content
        )

        messages = _build_messages(
            persona.system_prompt, memories, session.history, prompt
        )
        response = await chat_complete(messages)

        turns.append(
            CollaborationTurn(
                agent_id=agent_id,
                persona_name=persona.name,
                content=response,
                turn=turn_idx + 1,
            )
        )
        current_content = response
        session.add_message("user", prompt)
        session.add_message("assistant", response)
        session.touch()
        await cache.save(agent_id, db)

    summary_messages = [
        {
            "role": "user",
            "content": (
                f"Summarize this collaboration in 2-3 sentences:\n"
                + "\n".join(f"[{t.persona_name}]: {t.content}" for t in turns)
            ),
        }
    ]
    summary = await chat_complete(summary_messages)

    return CollaborationResult(session_id=session_id, turns=turns, summary=summary)
