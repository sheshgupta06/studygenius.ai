"""
SQLAlchemy ORM models for the FastAPI AI service.
These mirror the Prisma schema used by the Next.js backend.

Note: Vector embeddings are stored in ChromaDB (not PostgreSQL).
The DocumentChunk model stores chunk metadata only — no pgvector needed.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, DateTime, Enum as SAEnum,
    ForeignKey, JSON, Text
)
from sqlalchemy.orm import relationship
from app.models.orm import Base, UUIDType


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DocumentChunk(Base):
    """
    Stores chunked text metadata from PDFs.
    Vector embeddings are stored in ChromaDB (not here).
    Used for audit/reference purposes.
    """
    __tablename__ = "document_chunks"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUIDType(),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)   # page_number, section, source
    created_at = Column(DateTime(timezone=True), default=utcnow)
