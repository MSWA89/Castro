"""
Voice engine interface.

Defines the Protocol that any TTS/STT backend must satisfy.
The NullEngine is the default — it makes voice optional without
branching logic scattered across the codebase.

To add Piper, Kokoro, or any other engine:
  1. Implement VoiceEngine protocol
  2. Swap NullEngine for your implementation in get_engine()
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from ..core.config import settings


@runtime_checkable
class VoiceEngine(Protocol):
    async def synthesize(self, text: str, voice_id: str) -> bytes:
        """Convert text to audio bytes (WAV or MP3)."""
        ...

    async def transcribe(self, audio: bytes) -> str:
        """Convert audio bytes to text."""
        ...


class NullEngine:
    """No-op engine used when voice is disabled."""

    async def synthesize(self, text: str, voice_id: str) -> bytes:
        return b""

    async def transcribe(self, audio: bytes) -> str:
        return ""


def get_engine() -> VoiceEngine:
    if not settings.voice_enabled:
        return NullEngine()
    raise NotImplementedError(
        f"Voice engine '{settings.tts_engine}' not yet wired up. "
        "Set VOICE_ENABLED=false or implement the engine."
    )
