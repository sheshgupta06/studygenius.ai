"""
Pydantic Schemas — Request/Response contracts for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any, Union
from enum import Enum
from datetime import datetime
from uuid import UUID


# ── Enums ─────────────────────────────────────────────────────────────────────

class Plan(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class GenerationType(str, Enum):
    SUMMARY = "summary"
    NOTES = "notes"
    QUIZ = "quiz"
    FLASHCARDS = "flashcards"

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


# ── Auth Schemas ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    plan: Plan
    credits_used: int
    credits_limit: int
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Settings Schemas ───────────────────────────────────────────────────────────

class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    email_notifications: Optional[bool] = None

class SettingsResponse(BaseModel):
    theme: str
    language: str
    email_notifications: bool

    class Config:
        from_attributes = True


# ── User Schemas ───────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None

class DashboardActivity(BaseModel):
    id: UUID
    action: str
    created_at: datetime
    document_title: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    learning_progress: int
    weekly_goal: int
    docs_read: int
    quiz_score: int
    study_time_hours: float
    day_streak: int
    recent_activities: list[DashboardActivity]
    
    class Config:
        from_attributes = True


# ── Document Schemas ───────────────────────────────────────────────────────────

class CreateDocumentRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    original_name: str = Field(..., min_length=1, max_length=500)
    s3_key: str
    s3_url: str
    file_size: Optional[int] = None

class DocumentRenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)

class UpdateDocumentRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    original_name: Optional[str] = Field(None, min_length=1, max_length=500)

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    original_name: str
    s3_url: str
    file_size: Optional[int]
    page_count: Optional[int]
    status: DocumentStatus
    chroma_collection_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UploadUrlRequest(BaseModel):
    file_name: str = Field(..., min_length=1)
    file_type: str = Field(..., pattern=r"^application/pdf$")
    file_size: int = Field(..., gt=0, le=52_428_800)  # Max 50MB

class UploadUrlResponse(BaseModel):
    upload_url: str          # Presigned PUT URL
    s3_key: str              # Key to store with the document record
    s3_url: str              # Public URL after upload


# ── Ingest Schema ──────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    document_id: UUID

class IngestResponse(BaseModel):
    document_id: UUID
    status: DocumentStatus
    message: str
    chunk_count: Optional[int] = None


# ── Chat Schemas ───────────────────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    title: str = Field(default="New Chat", max_length=500)

class ConversationResponse(BaseModel):
    id: UUID
    document_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageSchema(BaseModel):
    role: MessageRole
    content: str

class ChatStreamRequest(BaseModel):
    document_id: UUID
    conversation_id: Optional[UUID] = None
    message: str = Field(..., min_length=1, max_length=4000)
    chat_history: list[ChatMessageSchema] = Field(default=[], max_length=20)

class SourceChunk(BaseModel):
    chunk_id: str
    content: str
    page_number: Optional[int] = None
    score: float

class MessageResponse(BaseModel):
    id: UUID
    role: MessageRole
    content: str
    sources: Optional[list[SourceChunk]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Generation Schemas ────────────────────────────────────────────────────────

class GenerationRequest(BaseModel):
    document_id: UUID
    generation_type: GenerationType
    options: Optional[dict[str, Any]] = None

# Summary
class SummaryContent(BaseModel):
    executive_summary: str
    key_points: list[str]
    sections: list[dict[str, str]]

class SummaryResponse(BaseModel):
    id: UUID
    document_id: UUID
    generation_type: GenerationType = GenerationType.SUMMARY
    content: SummaryContent
    created_at: datetime
    class Config: from_attributes = True

# Notes
class NoteSubsection(BaseModel):
    title: str
    content: str

class NoteSection(BaseModel):
    title: str
    content: str
    subsections: list[NoteSubsection] = []

class NotesContent(BaseModel):
    title: str
    sections: list[NoteSection]

class NoteResponse(BaseModel):
    id: UUID
    document_id: UUID
    generation_type: GenerationType = GenerationType.NOTES
    title: Optional[str]
    content: NotesContent
    created_at: datetime
    class Config: from_attributes = True

# Quiz
class QuizOption(BaseModel):
    key: str
    text: str

class QuizQuestion(BaseModel):
    question_number: int
    question: str
    options: list[QuizOption]
    correct_answer: str
    explanation: str
    difficulty: str

class QuizContent(BaseModel):
    title: str
    total_questions: int
    questions: list[QuizQuestion]

class QuizResponse(BaseModel):
    id: UUID
    document_id: UUID
    generation_type: GenerationType = GenerationType.QUIZ
    content: QuizContent
    created_at: datetime
    class Config: from_attributes = True

# Flashcards
class FlashcardSchema(BaseModel):
    card_number: int
    front: str
    back: str
    hint: Optional[str] = None

class FlashcardsContent(BaseModel):
    title: str
    total_cards: int
    cards: list[FlashcardSchema]

class FlashcardsResponse(BaseModel):
    id: UUID
    document_id: UUID
    generation_type: GenerationType = GenerationType.FLASHCARDS
    content: FlashcardsContent
    created_at: datetime
    class Config: from_attributes = True


# ── History Schema ─────────────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: UUID
    document_id: Optional[UUID]
    action: str
    metadata_: Optional[dict] = Field(default=None, alias="metadata")
    created_at: datetime
    document_title: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# ── Common ────────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    message: str

class PaginatedResponse(BaseModel):
    data: list[Any]
    total: int
    page: int
    page_size: int
    has_more: bool
