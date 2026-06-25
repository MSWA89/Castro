"""
Persona loader — reads YAML files from the personas directory.

Schema (personas/<id>.yaml):
  id:           str   — unique identifier, matches filename stem
  name:         str   — display name
  avatar:       str   — emoji or single character
  voice_id:     str   — voice engine identifier (optional)
  system_prompt: str  — the persona's core instruction
  traits:       list  — short trait descriptors
  capabilities: list  — domain tags shown in UI
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field, field_validator

from ..core.config import settings

logger = logging.getLogger(__name__)


class Persona(BaseModel):
    id: str
    name: str
    avatar: str = "◆"
    voice_id: str = "default"
    system_prompt: str
    traits: list[str] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)

    @field_validator("id")
    @classmethod
    def id_is_slug(cls, v: str) -> str:
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Persona id must be alphanumeric with hyphens/underscores")
        return v.lower()


class PersonaRegistry:
    def __init__(self) -> None:
        self._personas: dict[str, Persona] = {}

    def load_all(self) -> None:
        path = settings.personas_path
        if not path.exists():
            logger.warning("Personas directory not found: %s", path)
            return
        for f in path.glob("*.yaml"):
            try:
                self._load_file(f)
            except Exception as exc:
                logger.error("Failed to load persona %s: %s", f.name, exc)
        logger.info("Loaded %d personas", len(self._personas))

    def load_from_bytes(self, data: bytes, filename: str) -> Persona:
        raw = yaml.safe_load(data)
        persona = Persona.model_validate(raw)
        dest = settings.personas_path / f"{persona.id}.yaml"
        dest.write_bytes(data)
        self._personas[persona.id] = persona
        logger.info("Registered persona: %s", persona.id)
        return persona

    def get(self, persona_id: str) -> Persona | None:
        return self._personas.get(persona_id)

    def all(self) -> list[Persona]:
        return list(self._personas.values())

    def exists(self, persona_id: str) -> bool:
        return persona_id in self._personas

    def _load_file(self, path: Path) -> None:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        persona = Persona.model_validate(raw)
        self._personas[persona.id] = persona


registry = PersonaRegistry()
