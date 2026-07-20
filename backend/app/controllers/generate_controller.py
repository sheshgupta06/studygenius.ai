"""
Generate Routes — Summary, Notes, Quiz, Flashcards
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, cast, Union
from datetime import datetime
from uuid import UUID

from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, Document, Note, Summary, Quiz, Flashcard, ActivityLog
from app.models.schemas import (
    GenerationRequest, GenerationType, MessageOut,
    SummaryContent, SummaryResponse,
    NotesContent, NoteResponse, NoteSection,
    QuizContent, QuizResponse,
    FlashcardsContent, FlashcardsResponse,
)
from app.rag.summary.service import generation_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

DEFAULT_OPTIONS = {
    GenerationType.QUIZ: {"question_count": 10, "difficulty": "medium"},
    GenerationType.FLASHCARDS: {"card_count": 20},
}


# ── Unified response model for mixed list ──────────────────────────────────────
class AnyGenerationResponse(BaseModel):
    id: str
    document_id: str
    generation_type: GenerationType
    title: str
    content: Any
    created_at: datetime


@router.post("", status_code=status.HTTP_200_OK)
async def generate_content(
    request: GenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnyGenerationResponse:
    """
    Generates structured learning content from a document.
    Persists the result to the database and returns it.
    """
    # Verify document ownership + readiness
    doc_result = await db.execute(
        select(Document).where(Document.id == request.document_id, Document.user_id == current_user.id)
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document is not ready. Status: {doc.status}",
        )

    # Merge default options with user-provided options
    options = {**DEFAULT_OPTIONS.get(request.generation_type, {}), **(request.options or {})}

    saved: Union[Summary, Note, Quiz, Flashcard]

    try:
        if request.generation_type == GenerationType.SUMMARY:
            content = await generation_service.generate_summary(str(request.document_id))
            title = f"Summary — {doc.title}"
            saved = Summary(
                user_id=current_user.id,
                document_id=request.document_id,
                content=content.model_dump(),
            )

        elif request.generation_type == GenerationType.NOTES:
            content = await generation_service.generate_notes(str(request.document_id))
            title = f"Notes — {doc.title}"
            saved = Note(
                user_id=current_user.id,
                document_id=request.document_id,
                title=title,
                content=content.model_dump(),
            )

        elif request.generation_type == GenerationType.QUIZ:
            content = await generation_service.generate_quiz(
                str(request.document_id),
                question_count=int(options.get("question_count", 10)),
                difficulty=str(options.get("difficulty", "medium")),
            )
            title = f"Quiz — {doc.title}"
            saved = Quiz(
                user_id=current_user.id,
                document_id=request.document_id,
                content=content.model_dump(),
            )

        elif request.generation_type == GenerationType.FLASHCARDS:
            content = await generation_service.generate_flashcards(
                str(request.document_id),
                card_count=int(options.get("card_count", 20)),
            )
            title = f"Flashcards — {doc.title}"
            saved = Flashcard(
                user_id=current_user.id,
                document_id=request.document_id,
                content=content.model_dump(),
            )

        else:
            raise HTTPException(status_code=400, detail=f"Unknown generation type: {request.generation_type}")

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Content generation failed. Please try again.")

    db.add(saved)

    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        document_id=request.document_id,
        action=f"generated_{request.generation_type.value}",
    )
    db.add(log)
    await db.flush()

    return AnyGenerationResponse(
        id=str(saved.id),
        document_id=str(request.document_id),
        generation_type=request.generation_type,
        title=title,
        content=content.model_dump(),
        created_at=cast(datetime, saved.created_at),
    )


@router.get("/{document_id}", response_model=list[AnyGenerationResponse])
async def get_generated_content(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AnyGenerationResponse]:
    """Returns all previously generated content for a document."""
    # Verify ownership
    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found.")

    responses: list[AnyGenerationResponse] = []

    # Fetch summaries
    summaries = (await db.execute(
        select(Summary).where(Summary.document_id == document_id).order_by(Summary.created_at.desc())
    )).scalars().all()
    for item in summaries:
        responses.append(AnyGenerationResponse(
            id=str(item.id),
            document_id=str(item.document_id),
            generation_type=GenerationType.SUMMARY,
            title="Summary",
            content=SummaryContent(**cast(dict[str, Any], item.content)).model_dump(),
            created_at=cast(datetime, item.created_at),
        ))

    # Fetch notes
    notes = (await db.execute(
        select(Note).where(Note.document_id == document_id).order_by(Note.created_at.desc())
    )).scalars().all()
    for item in notes:
        responses.append(AnyGenerationResponse(
            id=str(item.id),
            document_id=str(item.document_id),
            generation_type=GenerationType.NOTES,
            title=cast(str, item.title) or "Notes",
            content=NotesContent(**cast(dict[str, Any], item.content)).model_dump(),
            created_at=cast(datetime, item.created_at),
        ))

    # Fetch quizzes
    quizzes = (await db.execute(
        select(Quiz).where(Quiz.document_id == document_id).order_by(Quiz.created_at.desc())
    )).scalars().all()
    for item in quizzes:
        responses.append(AnyGenerationResponse(
            id=str(item.id),
            document_id=str(item.document_id),
            generation_type=GenerationType.QUIZ,
            title="Quiz",
            content=QuizContent(**cast(dict[str, Any], item.content)).model_dump(),
            created_at=cast(datetime, item.created_at),
        ))

    # Fetch flashcards
    flashcards = (await db.execute(
        select(Flashcard).where(Flashcard.document_id == document_id).order_by(Flashcard.created_at.desc())
    )).scalars().all()
    for item in flashcards:
        responses.append(AnyGenerationResponse(
            id=str(item.id),
            document_id=str(item.document_id),
            generation_type=GenerationType.FLASHCARDS,
            title="Flashcards",
            content=FlashcardsContent(**cast(dict[str, Any], item.content)).model_dump(),
            created_at=cast(datetime, item.created_at),
        ))

    # Sort by created_at descending
    responses.sort(key=lambda r: r.created_at, reverse=True)
    return responses

