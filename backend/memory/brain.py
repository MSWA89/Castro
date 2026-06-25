"""
Obsidian-compatible brain backed by ChromaDB for semantic search.

Each agent gets brain/<agent_id>/ with markdown memory files that can be
opened directly in Obsidian. ChromaDB mirrors the same content for fast
vector retrieval.
"""

from __future__ import annotations

import json
import time
import uuid
from datetime import datetime
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from ..core.config import settings
from ..core.ollama_client import embed

_chroma: chromadb.ClientAPI | None = None


def _get_chroma() -> chromadb.ClientAPI:
    global _chroma
    if _chroma is None:
        settings.chroma_path.mkdir(parents=True, exist_ok=True)
        _chroma = chromadb.PersistentClient(
            path=str(settings.chroma_path),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma


def _collection(agent_id: str) -> chromadb.Collection:
    return _get_chroma().get_or_create_collection(
        name=f"agent_{agent_id}",
        metadata={"hnsw:space": "cosine"},
    )


def _brain_dir(agent_id: str) -> Path:
    d = settings.brain_path / agent_id
    d.mkdir(parents=True, exist_ok=True)
    return d


async def store(
    agent_id: str,
    content: str,
    tags: list[str],
    memory_id: str | None = None,
) -> str:
    memory_id = memory_id or str(uuid.uuid4())
    embedding = await embed(content)
    ts = time.time()
    dt = datetime.fromtimestamp(ts)

    _collection(agent_id).add(
        ids=[memory_id],
        embeddings=[embedding],
        documents=[content],
        metadatas=[{"agent_id": agent_id, "tags": json.dumps(tags), "timestamp": ts}],
    )

    _write_markdown(agent_id, memory_id, content, tags, dt)
    return memory_id


async def retrieve(agent_id: str, query: str, n: int | None = None) -> list[str]:
    n = n or settings.max_memory_results
    embedding = await embed(query)
    col = _collection(agent_id)

    if col.count() == 0:
        return []

    results = col.query(
        query_embeddings=[embedding],
        n_results=min(n, col.count()),
        include=["documents"],
    )
    return results["documents"][0] if results["documents"] else []


async def list_memories(agent_id: str, limit: int = 20) -> list[dict]:
    col = _collection(agent_id)
    if col.count() == 0:
        return []
    result = col.get(limit=limit, include=["documents", "metadatas"])
    return [
        {
            "id": result["ids"][i],
            "content": result["documents"][i],
            "tags": json.loads(result["metadatas"][i].get("tags", "[]")),
            "timestamp": result["metadatas"][i].get("timestamp"),
        }
        for i in range(len(result["ids"]))
    ]


def _write_markdown(
    agent_id: str,
    memory_id: str,
    content: str,
    tags: list[str],
    dt: datetime,
) -> None:
    slug = dt.strftime("%Y%m%d_%H%M%S")
    path = _brain_dir(agent_id) / f"{slug}_{memory_id[:8]}.md"
    tag_list = "\n".join(f"  - {t}" for t in tags)
    wikilinks = " ".join(f"[[{t}]]" for t in tags) if tags else ""
    path.write_text(
        f"---\n"
        f"agent: {agent_id}\n"
        f"date: {dt.isoformat()}\n"
        f"memory_id: {memory_id}\n"
        f"tags:\n{tag_list}\n"
        f"---\n\n"
        f"{content}\n\n"
        f"{wikilinks}\n",
        encoding="utf-8",
    )
    _update_index(agent_id, content, path.name, dt)


def _update_index(agent_id: str, content: str, filename: str, dt: datetime) -> None:
    index_path = _brain_dir(agent_id) / "index.md"
    entry = f"- [[{filename}]] — {dt.strftime('%Y-%m-%d %H:%M')} — {content[:80]}...\n"
    with index_path.open("a", encoding="utf-8") as f:
        f.write(entry)
