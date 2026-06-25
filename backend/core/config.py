from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Ollama
    ollama_host: str = "http://localhost:11434"
    chat_model: str = "qwen2.5:7b"
    embed_model: str = "nomic-embed-text"

    # Storage
    db_path: Path = Path("data/castro.db")
    brain_path: Path = Path("brain")
    chroma_path: Path = Path("data/chroma")
    personas_path: Path = Path("personas")

    # Session management
    max_hot_sessions: int = 5
    idle_timeout_seconds: int = 300
    max_conversation_history: int = 50

    # Memory
    max_memory_results: int = 5
    memory_extraction_enabled: bool = True

    # Voice
    voice_enabled: bool = False
    tts_engine: str = "piper"


settings = Settings()
