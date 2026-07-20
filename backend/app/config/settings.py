from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
from typing import Literal
from dotenv import load_dotenv

# Force .env values to override OS environment variables (fixes invalid global keys)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class Settings(BaseSettings):
    """
    Application settings — all values loaded from environment variables.
    Never hardcode secrets here.
    """

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "StudyGenius AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False

    # ── JWT ───────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    # ── ChromaDB ─────────────────────────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # ── AI Provider / Model Settings ───────────────────────────────────────────
    AI_PROVIDER: Literal["openai", "gemini"] = "gemini"

    GEMINI_API_KEY: str | None = None
    GEMINI_CHAT_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    GEMINI_EMBEDDING_DIMENSIONS: int = 768

    OPENAI_API_KEY: str | None = None
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_TEMPERATURE: float = 0.3

    # ── AWS S3 ───────────────────────────────────────────────────────────────
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = "dev-access-key"
    AWS_SECRET_ACCESS_KEY: str = "dev-secret-key"
    AWS_S3_BUCKET_NAME: str = "dev-bucket"
    S3_PRESIGNED_URL_EXPIRY: int = 3600     # seconds

    # ── RAG Pipeline ─────────────────────────────────────────────────────────
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 5

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]

    # ── Redis (optional, for caching) ──────────────────────────────────────────────
    REDIS_URL: str | None = None

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton — reads .env only once."""
    return Settings()
