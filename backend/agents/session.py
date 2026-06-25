"""
Hot/warm/cold session cache.

  Hot  — AgentSession object in RAM, history fully loaded (≤ max_hot_sessions)
  Warm — history list in RAM, no session object (last N evicted from hot)
  Cold — history on disk in SQLite only
"""

from __future__ import annotations

import time
from collections import OrderedDict

import aiosqlite

from ..core.config import settings
from .models import AgentSession


class SessionCache:
    def __init__(self) -> None:
        self._hot: OrderedDict[str, AgentSession] = OrderedDict()
        self._warm: OrderedDict[str, list[dict[str, str]]] = OrderedDict()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get(
        self,
        agent_id: str,
        persona_id: str,
        db: aiosqlite.Connection,
    ) -> AgentSession:
        if agent_id in self._hot:
            self._hot.move_to_end(agent_id)
            session = self._hot[agent_id]
            session.touch()
            return session

        if agent_id in self._warm:
            history = self._warm.pop(agent_id)
        else:
            history = await self._load_from_db(agent_id, db)

        return await self._promote(agent_id, persona_id, history, db)

    async def save(self, agent_id: str, db: aiosqlite.Connection) -> None:
        """Flush an agent's history to SQLite."""
        if agent_id not in self._hot:
            return
        session = self._hot[agent_id]
        await self._persist_history(agent_id, session.history, db)

    async def evict_idle(self, db: aiosqlite.Connection) -> None:
        """Move idle hot sessions to cold storage."""
        idle = [
            sid
            for sid, s in self._hot.items()
            if s.is_idle(settings.idle_timeout_seconds)
        ]
        for sid in idle:
            session = self._hot.pop(sid)
            await self._persist_history(sid, session.history, db)

    def put_session(self, session: AgentSession) -> None:
        """Register a freshly created session into hot tier."""
        self._hot[session.agent_id] = session
        self._hot.move_to_end(session.agent_id)
        self._maybe_evict_hot_to_warm()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _promote(
        self,
        agent_id: str,
        persona_id: str,
        history: list[dict[str, str]],
        db: aiosqlite.Connection,
    ) -> AgentSession:
        self._maybe_evict_hot_to_warm()
        session = AgentSession(
            agent_id=agent_id,
            persona_id=persona_id,
            history=history,
        )
        self._hot[agent_id] = session
        return session

    def _maybe_evict_hot_to_warm(self) -> None:
        while len(self._hot) >= settings.max_hot_sessions:
            old_id, old_session = self._hot.popitem(last=False)
            self._warm[old_id] = old_session.history

    async def _load_from_db(
        self,
        agent_id: str,
        db: aiosqlite.Connection,
    ) -> list[dict[str, str]]:
        async with db.execute(
            "SELECT role, content FROM messages WHERE agent_id = ? ORDER BY id",
            (agent_id,),
        ) as cursor:
            rows = await cursor.fetchall()
        history = [{"role": r["role"], "content": r["content"]} for r in rows]
        return history[-settings.max_conversation_history :]

    async def _persist_history(
        self,
        agent_id: str,
        history: list[dict[str, str]],
        db: aiosqlite.Connection,
    ) -> None:
        await db.execute("DELETE FROM messages WHERE agent_id = ?", (agent_id,))
        now = time.time()
        await db.executemany(
            "INSERT INTO messages (agent_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
            [(agent_id, m["role"], m["content"], now) for m in history],
        )
        await db.commit()


cache = SessionCache()
