"""
Embeddings Service
Generates vector embeddings using OpenAI or Google Gemini depending on configured provider.
"""

import logging
import openai
from google import genai
from google.genai import types as genai_types
from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmbeddingsService:
    """
    Wraps OpenAI or Gemini embeddings API with batching and error handling.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.batch_size = 100

        if self.provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
            openai.api_key = settings.OPENAI_API_KEY
            self.model = settings.OPENAI_EMBEDDING_MODEL
        else:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is required when AI_PROVIDER=gemini")
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model = settings.GEMINI_EMBEDDING_MODEL

    async def embed_text(self, text: str) -> list[float]:
        if not text or not text.strip():
            raise ValueError("Cannot embed empty text.")

        text = text.strip().replace("\n", " ")

        try:
            if self.provider == "openai":
                response = await openai.Embedding.acreate(
                    model=self.model,
                    input=text,
                )
                return response.data[0].embedding

            response = self.client.models.embed_content(
                model=self.model,
                contents=text,
                config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            return response.embeddings[0].values

        except Exception as e:
            logger.error(f"Embedding failed for provider={self.provider}: {e}")
            raise

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        cleaned_texts = [t.strip().replace("\n", " ") for t in texts]
        all_embeddings: list[list[float]] = []

        for i in range(0, len(cleaned_texts), self.batch_size):
            batch = cleaned_texts[i : i + self.batch_size]
            logger.info(f"Embedding batch {i // self.batch_size + 1} ({len(batch)} texts)")

            try:
                if self.provider == "openai":
                    response = await openai.Embedding.acreate(
                        model=self.model,
                        input=batch,
                    )
                    all_embeddings.extend([item.embedding for item in response.data])
                else:
                    response = self.client.models.embed_content(
                        model=self.model,
                        contents=batch,
                        config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
                    )
                    all_embeddings.extend([emb.values for emb in response.embeddings])

            except Exception as e:
                logger.error(f"Embedding batch failed for provider={self.provider} at batch {i}: {e}")
                raise

        logger.info(f"Successfully generated {len(all_embeddings)} embeddings")
        return all_embeddings


# Singleton instance
embeddings_service = EmbeddingsService()
