"""
Generate Routes — Summary, Notes, Quiz, Flashcards
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, Document, ActivityLog, Note, Summary, Quiz, Flashcard
from app.models.schemas import (
    GenerationRequest, GenerationType, MessageOut,
    SummaryResponse, NoteResponse, QuizResponse, FlashcardsResponse
)
from app.rag.summary.service import generation_service
from typing import Union

logger = logging.getLogger(__name__)
router = APIRouter()

DEFAULT_OPTIONS = {
    GenerationType.QUIZ: {"question_count": 10, "difficulty": "medium"},
    GenerationType.FLASHCARDS: {"card_count": 20},
}


@router.post("", status_code=status.HTTP_200_OK)
async def generate_content(
    request: GenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates structured learning content from a document.
    Persists the result to the specific table based on type and returns it.
    """
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

    options = {**DEFAULT_OPTIONS.get(request.generation_type, {}), **(request.options or {})}

    try:
        if request.generation_type == GenerationType.SUMMARY:
            content = await generation_service.generate_summary(str(request.document_id))
            model_class = Summary
            response_class = SummaryResponse
        elif request.generation_type == GenerationType.NOTES:
            content = await generation_service.generate_notes(str(request.document_id))
            model_class = Note
            response_class = NoteResponse
        elif request.generation_type == GenerationType.QUIZ:
            content = await generation_service.generate_quiz(
                str(request.document_id),
                question_count=options.get("question_count", 10),
                difficulty=options.get("difficulty", "medium"),
            )
            model_class = Quiz
            response_class = QuizResponse
        elif request.generation_type == GenerationType.FLASHCARDS:
            content = await generation_service.generate_flashcards(
                str(request.document_id),
                card_count=options.get("card_count", 20),
            )
            model_class = Flashcard
            response_class = FlashcardsResponse
        else:
            raise HTTPException(status_code=400, detail=f"Unknown type: {request.generation_type}")

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Check if it's a google genai ClientError by name or attribute
        error_name = type(e).__name__
        if error_name in ["ClientError", "APIError", "ServerError"]:
            status_code = getattr(e, "code", 500)
            if status_code == 429:
                raise HTTPException(status_code=429, detail="API Quota Exceeded. Please check your Gemini API billing and usage.")
            elif status_code == 404:
                raise HTTPException(status_code=400, detail="Requested AI model is not available for this API key.")
            elif status_code == 400:
                raise HTTPException(status_code=400, detail="Invalid API Key or Bad Request.")
            elif status_code == 503:
                raise HTTPException(status_code=503, detail="AI Service is currently overloaded (503). Please try again later.")
            
        logger.error(f"Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Content generation failed.")

    # Check if a record already exists
    result = await db.execute(
        select(model_class).where(model_class.document_id == request.document_id)
    )
    saved = result.scalar_one_or_none()
    
    if saved:
        saved.content = content.model_dump()
        if request.generation_type == GenerationType.NOTES:
            saved.title = content.title
    else:
        saved = model_class(
            user_id=current_user.id,
            document_id=request.document_id,
            content=content.model_dump(),
        )
        if request.generation_type == GenerationType.NOTES:
            saved.title = content.title
        db.add(saved)

    log = ActivityLog(
        user_id=current_user.id,
        document_id=request.document_id,
        action=f"generated_{request.generation_type.value}",
    )
    db.add(log)
    await db.flush()

    return response_class.model_validate(saved)


@router.get("/{document_id}", status_code=status.HTTP_200_OK)
async def get_generated_content(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all generated content for a document."""
    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found.")

    responses = []
    
    # Check Summary
    summary = (await db.execute(select(Summary).where(Summary.document_id == document_id))).scalar_one_or_none()
    if summary: responses.append(SummaryResponse.model_validate(summary))
    
    # Check Note
    note = (await db.execute(select(Note).where(Note.document_id == document_id))).scalar_one_or_none()
    if note: responses.append(NoteResponse.model_validate(note))
    
    # Check Quiz
    quiz = (await db.execute(select(Quiz).where(Quiz.document_id == document_id))).scalar_one_or_none()
    if quiz: responses.append(QuizResponse.model_validate(quiz))
    
    # Check Flashcards
    flashcards = (await db.execute(select(Flashcard).where(Flashcard.document_id == document_id))).scalar_one_or_none()
    if flashcards: responses.append(FlashcardsResponse.model_validate(flashcards))

    return responses
