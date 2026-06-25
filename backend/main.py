"""
Castro — Chief of Staff
FastAPI application entry point.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core import database
from .core.config import settings
from .core.claude_client import health_check
from .agents.router import router as agents_router
from .personas.loader import registry
from .personas.router import router as personas_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings.brain_path.mkdir(parents=True, exist_ok=True)
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    settings.personas_path.mkdir(parents=True, exist_ok=True)

    await database.init()
    registry.load_all()

    yield

    await database.close()


app = FastAPI(
    title="Castro",
    description="Chief of Staff — multi-agent AI system",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(personas_router)


@app.get("/health")
async def health() -> dict:
    claude_ok = await health_check()
    return {
        "status": "ok" if claude_ok else "degraded",
        "claude": "connected" if claude_ok else "unreachable",
        "chat_model": settings.chat_model,
        "personas_loaded": len(registry.all()),
    }


# Serve the dashboard — must be mounted last so API routes take priority
_frontend = Path(__file__).parent.parent / "frontend"
if _frontend.exists():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")
