from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from .loader import registry, Persona

router = APIRouter(prefix="/personas", tags=["personas"])


class PersonaOut(BaseModel):
    id: str
    name: str
    avatar: str
    voice_id: str
    traits: list[str]
    capabilities: list[str]


@router.get("", response_model=list[PersonaOut])
async def list_personas() -> list[PersonaOut]:
    return [
        PersonaOut(
            id=p.id,
            name=p.name,
            avatar=p.avatar,
            voice_id=p.voice_id,
            traits=p.traits,
            capabilities=p.capabilities,
        )
        for p in registry.all()
    ]


@router.get("/{persona_id}", response_model=PersonaOut)
async def get_persona(persona_id: str) -> PersonaOut:
    persona = registry.get(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    return PersonaOut(
        id=persona.id,
        name=persona.name,
        avatar=persona.avatar,
        voice_id=persona.voice_id,
        traits=persona.traits,
        capabilities=persona.capabilities,
    )


@router.post("", response_model=PersonaOut, status_code=201)
async def upload_persona(file: UploadFile = File(...)) -> PersonaOut:
    if not file.filename or not file.filename.endswith(".yaml"):
        raise HTTPException(status_code=400, detail="File must be a .yaml file")
    data = await file.read()
    try:
        persona = registry.load_from_bytes(data, file.filename)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return PersonaOut(
        id=persona.id,
        name=persona.name,
        avatar=persona.avatar,
        voice_id=persona.voice_id,
        traits=persona.traits,
        capabilities=persona.capabilities,
    )


@router.delete("/{persona_id}", status_code=204)
async def delete_persona(persona_id: str) -> None:
    from ..core.config import settings
    persona = registry.get(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    path = settings.personas_path / f"{persona_id}.yaml"
    if path.exists():
        path.unlink()
    registry._personas.pop(persona_id, None)
