from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum

from pydantic import BaseModel, Field


class AgentState(str, Enum):
    dormant = "dormant"
    loaded = "loaded"
    active = "active"
    collaborating = "collaborating"


class Message(BaseModel):
    role: str
    content: str


class AgentRecord(BaseModel):
    id: str
    persona_id: str
    created_at: float
    last_active: float
    state: AgentState = AgentState.dormant


class Attachment(BaseModel):
    type: str                     # "text_file" | "image"
    name: str = ""
    content: str = ""             # text file content or empty for images
    media_type: str = ""          # e.g. "image/png"
    data: str = ""                # base64 for images


class ChatRequest(BaseModel):
    prompt: str
    attachments: list[Attachment] | None = None


class ChatResponse(BaseModel):
    agent_id: str
    content: str
    memories_used: int = 0


class CollaborationRequest(BaseModel):
    agent_ids: list[str] = Field(..., min_length=2, max_length=4)
    prompt: str
    max_turns: int = Field(default=4, ge=2, le=12)


class CollaborationTurn(BaseModel):
    agent_id: str
    persona_name: str
    content: str
    turn: int


class CollaborationResult(BaseModel):
    session_id: str
    turns: list[CollaborationTurn]
    summary: str


@dataclass
class AgentSession:
    agent_id: str
    persona_id: str
    history: list[dict[str, str]] = field(default_factory=list)
    last_active: float = field(default_factory=time.time)

    def touch(self) -> None:
        self.last_active = time.time()

    def add_message(self, role: str, content: str) -> None:
        self.history.append({"role": role, "content": content})

    def is_idle(self, timeout_seconds: int) -> bool:
        return (time.time() - self.last_active) > timeout_seconds
