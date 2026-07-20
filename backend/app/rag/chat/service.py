"""
RAG Chat Service — StudyGenius AI
Supports OpenAI or Gemini streaming chat with ChromaDB-powered retrieval.
"""

import logging
import json
from typing import AsyncGenerator
import openai
from google import genai
from google.genai import types as genai_types

from app.config.settings import get_settings
from app.rag.embeddings.service import embeddings_service
from app.rag.vectorstore.chroma import chroma_store
from app.models.schemas import ChatStreamRequest, SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()

CHAT_SYSTEM_PROMPT = """You are StudyGenius AI, an expert learning assistant.
Your role is to help students deeply understand their PDF documents.

STRICT RULES:
1. ONLY answer using the provided document context. Never use outside knowledge.
2. If the information is missing from the context, clearly say: "I couldn't find that information in your uploaded document."
3. Always cite page numbers when referencing content (e.g., "According to page 3...")
4. Be concise, clear, and educational. Use bullet points and structure when helpful.
5. Never hallucinate or fabricate facts.

Format responses in clean markdown with headers, bullets, and code blocks where appropriate."""


class ChatService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.model_name = settings.OPENAI_CHAT_MODEL if self.provider == "openai" else settings.GEMINI_CHAT_MODEL

        if self.provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
            openai.api_key = settings.OPENAI_API_KEY
        else:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is required when AI_PROVIDER=gemini")
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _build_context(self, chunks: list[SourceChunk]) -> str:
        if not chunks:
            return "No relevant context found in the document."

        parts = []
        for i, chunk in enumerate(chunks, 1):
            page = f"[Page {chunk.page_number}]" if chunk.page_number else f"[Section {i}]"
            parts.append(f"{page}\n{chunk.content}")
        return "\n\n---\n\n".join(parts)

    def _format_history_for_openai(self, history: list[dict]) -> list[dict]:
        return [{"role": "assistant" if m["role"] == "assistant" else "user", "content": m["content"]} for m in history][-10:]

    def _format_history_for_gemini(self, history: list[dict]) -> list[genai_types.Content]:
        formatted = []
        for m in history[-10:]:
            role = "model" if m["role"] == "assistant" else "user"
            formatted.append(
                genai_types.Content(role=role, parts=[genai_types.Part(text=m["content"])])
            )
        return formatted

    async def stream_response(self, request: ChatStreamRequest) -> AsyncGenerator[str, None]:
        try:
            query_embedding = await embeddings_service.embed_text(request.message)
            chunks = chroma_store.similarity_search(
                document_id=str(request.document_id),
                query_embedding=query_embedding,
                top_k=settings.RETRIEVAL_TOP_K,
            )

            yield f"data: {json.dumps({'type': 'sources', 'data': [c.model_dump() for c in chunks]})}\n\n"

            context = self._build_context(chunks)
            history = [{"role": m.role, "content": m.content} for m in request.chat_history]
            prompt = f"DOCUMENT CONTEXT:\n{context}\n\n---\n\nUSER QUESTION: {request.message}\n\nAnswer based only on the document context above."

            if self.provider == "openai":
                messages = [
                    {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                    *self._format_history_for_openai(history),
                    {"role": "user", "content": prompt},
                ]
                stream = await openai.ChatCompletion.acreate(
                    model=self.model_name,
                    messages=messages,
                    temperature=settings.OPENAI_TEMPERATURE,
                    max_tokens=1500,
                    stream=True,
                )
                async for event in stream:
                    for choice in event.choices:
                        delta = getattr(choice, "delta", choice.get("delta", {}))
                        if not delta:
                            continue
                        content = delta.get("content")
                        if content:
                            yield f"data: {json.dumps({'type': 'token', 'data': content})}\n\n"

            else:
                # New google.genai SDK — streaming with chat history
                gemini_history = self._format_history_for_gemini(history)
                config = genai_types.GenerateContentConfig(
                    system_instruction=CHAT_SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=1500,
                )

                async for chunk in await self.client.aio.models.generate_content_stream(
                    model=self.model_name,
                    contents=gemini_history + [genai_types.Content(role="user", parts=[genai_types.Part(text=prompt)])],
                    config=config,
                ):
                    if chunk.text:
                        yield f"data: {json.dumps({'type': 'token', 'data': chunk.text})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'data': ''})}\n\n"

        except Exception as e:
            logger.error(f"Chat stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'data': 'An error occurred. Please try again.'})}\n\n"


chat_service = ChatService()
