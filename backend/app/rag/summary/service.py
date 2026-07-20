"""
Content Generation Service
Generates structured learning content (summaries, notes, quizzes, flashcards)
from document context using OpenAI or Google Gemini.
"""

import logging
import json
import openai
from google import genai
from google.genai import types as genai_types

from app.config.settings import get_settings
from app.rag.vectorstore.chroma import chroma_store
from app.models.schemas import (
    GenerationType, GenerationRequest,
    SummaryContent, NotesContent, NoteSection,
    QuizContent, QuizQuestion, QuizOption,
    FlashcardsContent, FlashcardSchema,
)

logger = logging.getLogger(__name__)
settings = get_settings()

if settings.AI_PROVIDER.lower() == "openai":
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
    openai.api_key = settings.OPENAI_API_KEY


# ── Generation Prompts ────────────────────────────────────────────────────────

SUMMARY_PROMPT = """You are an expert academic summarizer. Analyze the provided document and generate a comprehensive summary.

Return ONLY a valid JSON object with this exact structure:
{
  "executive_summary": "A 2-3 paragraph comprehensive overview of the entire document",
  "key_points": ["key point 1", "key point 2", "key point 3", ...],
  "sections": [
    {"title": "Section Title", "content": "Section summary paragraph"}
  ]
}

Rules:
- executive_summary: 150-300 words covering main topics, arguments, and conclusions
- key_points: 5-10 most important takeaways as clear, concise statements
- sections: 3-8 logical sections based on document structure
- Be factual and precise. Never add information not in the document."""

NOTES_PROMPT = """You are an expert study notes creator. Create comprehensive, well-structured study notes from the document.

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Document Title / Main Topic",
  "sections": [
    {
      "title": "Section Title",
      "content": "Main content paragraph or explanation",
      "subsections": [
        {"title": "Sub-topic", "content": "Details..."}
      ]
    }
  ]
}

Rules:
- Create 4-8 main sections covering all major topics
- Each section should have 2-4 subsections for detailed breakdowns
- Use clear, student-friendly language
- Include definitions, explanations, and key concepts
- Preserve technical terms and important details"""

QUIZ_PROMPT = """You are an expert quiz creator. Generate a multiple-choice quiz based on the document.

Number of questions to generate: {question_count}
Difficulty: {difficulty}

Return ONLY a valid JSON object with this exact structure:
{{
  "title": "Quiz Title",
  "total_questions": {question_count},
  "questions": [
    {{
      "question_number": 1,
      "question": "Clear question text?",
      "options": [
        {{"key": "A", "text": "Option A text"}},
        {{"key": "B", "text": "Option B text"}},
        {{"key": "C", "text": "Option C text"}},
        {{"key": "D", "text": "Option D text"}}
      ],
      "correct_answer": "A",
      "explanation": "Why A is correct, and why others are wrong",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}

Rules:
- Generate exactly {question_count} questions
- Make questions test understanding, not just memorization
- All 4 options must be plausible (no obviously wrong distractors)
- Explanations must be clear and educational
- Vary difficulty as requested"""

FLASHCARDS_PROMPT = """You are an expert flashcard creator for spaced repetition learning. Create flashcards from the document.

Number of cards to generate: {card_count}

Return ONLY a valid JSON object with this exact structure:
{{
  "title": "Flashcard Set Title",
  "total_cards": {card_count},
  "cards": [
    {{
      "card_number": 1,
      "front": "Term, concept, or question",
      "back": "Definition, explanation, or answer",
      "hint": "Optional memory hint or mnemonic"
    }}
  ]
}}

Rules:
- Front should be a clear term, concept, or question (short: 5-15 words max)
- Back should be a complete explanation (20-80 words)
- Cover all major terms, concepts, dates, formulas, and definitions
- Hints should be memorable mnemonics or associations (optional but encouraged)
- Generate exactly {card_count} cards"""


class GenerationService:
    """
    Generates structured learning content from document text using OpenAI or Google Gemini.
    All outputs are validated against Pydantic schemas before returning.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.model_name = settings.OPENAI_CHAT_MODEL if self.provider == "openai" else settings.GEMINI_CHAT_MODEL

        if self.provider == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is required for Gemini provider")
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def _generate_json(self, system_prompt: str, document_context: str, max_tokens: int = 4000) -> dict:
        """
        Internal helper: calls the selected AI provider and returns parsed JSON.
        """
        try:
            prompt = f"DOCUMENT CONTENT:\n\n{document_context}\n\nGenerate the requested content as valid JSON."

            if self.provider == "openai":
                response = await openai.ChatCompletion.acreate(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=settings.OPENAI_TEMPERATURE,
                    max_tokens=max_tokens,
                )
                raw_content = response.choices[0].message.content
            else:
                # New google.genai SDK
                config = genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.4,
                    max_output_tokens=max_tokens,
                )
                response = await self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )
                raw_content = response.text

            if not raw_content:
                raise ValueError("AI provider returned empty content.")

            # Strip markdown code fences if present
            raw_content = raw_content.strip()
            if raw_content.startswith("```"):
                raw_content = raw_content.split("```", 2)[1]
                if raw_content.startswith("json"):
                    raw_content = raw_content[4:]
                raw_content = raw_content.rsplit("```", 1)[0].strip()

            # Clean up illegal trailing commas (often generated by smaller models)
            import re
            raw_content = re.sub(r',\s*([\]}])', r'\1', raw_content)

            return json.loads(raw_content)

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed. Raw content: {raw_content[:200]}... Error: {e}")
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            logger.error(f"AI generation failed: {e}", exc_info=True)
            raise


    async def generate_summary(self, document_id: str) -> SummaryContent:
        logger.info(f"Generating summary for document {document_id}")
        context = chroma_store.get_full_document_context(document_id, max_chunks=40)
        data = await self._generate_json(SUMMARY_PROMPT, context, max_tokens=2000)
        return SummaryContent(**data)

    async def generate_notes(self, document_id: str) -> NotesContent:
        logger.info(f"Generating notes for document {document_id}")
        context = chroma_store.get_full_document_context(document_id, max_chunks=50)
        data = await self._generate_json(NOTES_PROMPT, context, max_tokens=3000)

        sections = [NoteSection(**s) for s in data.get("sections", [])]
        return NotesContent(title=data.get("title", "Study Notes"), sections=sections)

    async def generate_quiz(self, document_id: str, question_count: int = 10, difficulty: str = "medium") -> QuizContent:
        logger.info(f"Generating {question_count} {difficulty} quiz questions for document {document_id}")
        context = chroma_store.get_full_document_context(document_id, max_chunks=40)

        prompt = QUIZ_PROMPT.format(question_count=question_count, difficulty=difficulty)
        data = await self._generate_json(prompt, context, max_tokens=4000)

        questions = []
        for q in data.get("questions", []):
            options = [QuizOption(**opt) for opt in q.get("options", [])]
            questions.append(
                QuizQuestion(
                    question_number=q["question_number"],
                    question=q["question"],
                    options=options,
                    correct_answer=q["correct_answer"],
                    explanation=q["explanation"],
                    difficulty=q.get("difficulty", difficulty),
                )
            )

        return QuizContent(
            title=data.get("title", "Quiz"),
            total_questions=len(questions),
            questions=questions,
        )

    async def generate_flashcards(self, document_id: str, card_count: int = 20) -> FlashcardsContent:
        logger.info(f"Generating {card_count} flashcards for document {document_id}")
        context = chroma_store.get_full_document_context(document_id, max_chunks=40)

        prompt = FLASHCARDS_PROMPT.format(card_count=card_count)
        data = await self._generate_json(prompt, context, max_tokens=3000)

        cards = [FlashcardSchema(**card) for card in data.get("cards", [])]
        return FlashcardsContent(
            title=data.get("title", "Flashcard Set"),
            total_cards=len(cards),
            cards=cards,
        )


# Singleton instance
generation_service = GenerationService()
