"""
SQLAlchemy ORM Models — StudyGenius AI
Contains models for Users, Documents, Sessions, Settings, Chat, and structured Generations.
Includes Soft Delete support across all primary entities.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text,
    ForeignKey, JSON, Enum as SAEnum, BigInteger, types
)
from sqlalchemy.orm import relationship, DeclarativeBase


class UUIDType(types.TypeDecorator):
    """
    Platform-independent UUID type stored as String(36).

    Safely accepts and coerces:
      - uuid.UUID objects
      - Hyphenated UUID strings  ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
      - Bare 32-char hex strings ("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
      - 16-byte binary values
      - Integer UUID representations
    on both the write (bind) and read (result) paths.
    """
    impl = types.String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Coerce any UUID-like value to a canonical hyphenated string for storage."""
        if value is None:
            return None
        # Already a UUID object — fastest path
        if isinstance(value, uuid.UUID):
            return str(value)
        # 16-byte binary representation
        if isinstance(value, bytes):
            try:
                return str(uuid.UUID(bytes=value))
            except (ValueError, AttributeError):
                pass
        # Integer representation
        if isinstance(value, int):
            try:
                return str(uuid.UUID(int=value))
            except (ValueError, OverflowError):
                pass
        # String — may be hyphenated ("xxxxxxxx-xxxx-…") or bare hex ("xxxxxxxxxxxxxxxx…")
        if isinstance(value, str):
            s = value.strip()
            try:
                return str(uuid.UUID(s))
            except ValueError:
                pass
            # Try treating as bare 32-char hex
            if len(s) == 32:
                try:
                    return str(uuid.UUID(hex=s))
                except ValueError:
                    pass
            # Last resort — store as-is and let the DB surface the error
            return s
        # Anything else: attempt str conversion and parse
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError):
            return str(value)

    def process_result_value(self, value, dialect):
        """Convert stored string (or bytes) back to a uuid.UUID object."""
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        if isinstance(value, bytes):
            try:
                return uuid.UUID(bytes=value)
            except (ValueError, AttributeError):
                pass
        try:
            return uuid.UUID(str(value))
        except (ValueError, AttributeError):
            return value

    def coerce_compared_value(self, op, value):
        """Allow WHERE-clause comparisons with both uuid.UUID and str values."""
        return self


def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    plan = Column(SAEnum("free", "pro", "enterprise", name="plan_enum"), default="free", nullable=False)
    credits_used = Column(Integer, default=0, nullable=False)
    credits_limit = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    """User Sessions for authentication and tracking."""
    __tablename__ = "sessions"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="sessions")

class Settings(Base):
    """User preferences."""
    __tablename__ = "settings"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    theme = Column(String, default="dark", nullable=False)
    language = Column(String, default="en", nullable=False)
    email_notifications = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="settings")

class Document(Base):
    """PDF documents uploaded by users."""
    __tablename__ = "documents"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    s3_key = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=True)
    page_count = Column(Integer, nullable=True)
    status = Column(SAEnum("uploading", "processing", "ready", "failed", name="document_status_enum"), default="uploading", nullable=False)
    chroma_collection_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="documents")
    conversations = relationship("Conversation", back_populates="document", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="document")
    
    notes = relationship("Note", back_populates="document", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="document", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="document", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="document", cascade="all, delete-orphan")

class Conversation(Base):
    """Chat sessions (Chat History)."""
    __tablename__ = "conversations"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), default="New Chat", nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="conversations")
    document = relationship("Document", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    """Messages inside a chat."""
    __tablename__ = "messages"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUIDType(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SAEnum("user", "assistant", name="message_role_enum"), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    conversation = relationship("Conversation", back_populates="messages")

class Note(Base):
    __tablename__ = "notes"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=True)
    content = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="notes")
    document = relationship("Document", back_populates="notes")

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="summaries")
    document = relationship("Document", back_populates="summaries")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="quizzes")
    document = relationship("Document", back_populates="quizzes")

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="flashcards")
    document = relationship("Document", back_populates="flashcards")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUIDType(), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="activity_logs")
    document = relationship("Document", back_populates="activity_logs")
