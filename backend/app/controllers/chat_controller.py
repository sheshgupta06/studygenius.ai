"""
Chat Routes — Conversations, Messages, and SSE Streaming Chat
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, Document, Conversation, Message, ActivityLog
from app.models.schemas import (
    CreateConversationRequest, ConversationResponse,
    ChatStreamRequest, MessageResponse, MessageOut
)
from app.rag.chat.service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Conversations ──────────────────────────────────────────────────────────────

@router.get("/{document_id}/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationResponse]:
    """Returns all conversations for a document, owned by the current user."""
    # Verify document ownership
    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found.")

    result = await db.execute(
        select(Conversation)
        .where(Conversation.document_id == document_id, Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    convos = result.scalars().all()
    return [ConversationResponse.model_validate(c) for c in convos]


@router.post("/{document_id}/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    document_id: str,
    request: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationResponse:
    """Creates a new conversation for a document."""
    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found.")

    convo = Conversation(
        user_id=current_user.id,
        document_id=document_id,
        title=request.title,
    )
    db.add(convo)
    await db.flush()
    return ConversationResponse.model_validate(convo)


@router.delete("/conversations/{conversation_id}", response_model=MessageOut)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    """Deletes a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    await db.delete(convo)
    return MessageOut(message="Conversation deleted.")


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageResponse]:
    """Returns all messages in a conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = msg_result.scalars().all()
    return [MessageResponse.model_validate(m) for m in messages]


# ── SSE Streaming Chat ─────────────────────────────────────────────────────────

@router.post("/stream")
async def stream_chat(
    request: ChatStreamRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    RAG-powered streaming chat endpoint.
    Returns an SSE stream with: sources → tokens → done events.
    The frontend reads this stream in real-time to update the UI.
    """
    # Validate document ownership
    doc_result = await db.execute(
        select(Document).where(
            Document.id == request.document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document is not ready for chat. Current status: {doc.status}",
        )

    # Log activity (best effort — don't fail the stream for this)
    try:
        log = ActivityLog(
            user_id=current_user.id,
            document_id=request.document_id,
            action="chatted",
        )
        db.add(log)
        await db.flush()
    except Exception:
        pass

    return StreamingResponse(
        chat_service.stream_response(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
