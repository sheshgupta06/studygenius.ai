"""
PDF Processing Service
Handles extraction, cleaning, and chunking of PDF documents.
"""

import logging
import io
import aiofiles
from typing import Optional
import boto3
from botocore.exceptions import ClientError
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PDFProcessorService:
    """
    Responsible for:
    1. Downloading PDFs from S3
    2. Extracting text with page metadata (using pdfplumber)
    3. Splitting text into parent/child chunks for RAG
    """

    def __init__(self):
        self._s3_client = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    @property
    def s3_client(self):
        """Lazily initialize S3 client."""
        if self._s3_client is None:
            from botocore.config import Config
            self._s3_client = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                endpoint_url=f"https://s3.{settings.AWS_REGION}.amazonaws.com",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(s3={'addressing_style': 'path'}, signature_version='s3v4')
            )
        return self._s3_client

    async def download_from_s3(self, s3_key: str) -> bytes:
        """
        Downloads a PDF file from S3 and returns its bytes.
        Raises an exception if the file is not found or access is denied.
        """
        try:
            logger.info(f"Downloading PDF from S3: {s3_key}")
            response = self.s3_client.get_object(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
            )
            content = response["Body"].read()
            logger.info(f"Downloaded {len(content)} bytes from S3")
            return content
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"S3 download failed [{error_code}]: {s3_key}")
            raise ValueError(f"Failed to download PDF from storage: {error_code}")

    def extract_text_with_metadata(self, pdf_bytes: bytes) -> list[dict]:
        """
        Extracts text from a PDF, preserving page numbers and structure.
        Returns a list of page dictionaries: [{page_number, text, word_count}]
        """
        pages = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total_pages = len(pdf.pages)
            logger.info(f"Extracting text from {total_pages} pages")

            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract plain text from page
                text = page.extract_text()

                # Skip empty pages
                if not text or len(text.strip()) < 10:
                    continue

                # Clean the text
                cleaned_text = self._clean_text(text)

                pages.append({
                    "page_number": page_num,
                    "text": cleaned_text,
                    "word_count": len(cleaned_text.split()),
                })

        logger.info(f"Extracted text from {len(pages)} non-empty pages")
        return pages

    def create_chunks(self, pages: list[dict]) -> list[dict]:
        """
        Splits page text into overlapping chunks for embedding.
        Each chunk retains page_number metadata for citation.
        Returns a list of chunk dictionaries.
        """
        all_chunks = []
        chunk_index = 0

        for page in pages:
            page_text = page["text"]
            page_number = page["page_number"]

            # Split the page text into chunks
            splits = self.text_splitter.split_text(page_text)

            for split_text in splits:
                if len(split_text.strip()) < 20:
                    continue  # Skip very short chunks

                all_chunks.append({
                    "chunk_index": chunk_index,
                    "content": split_text.strip(),
                    "metadata": {
                        "page_number": page_number,
                        "word_count": len(split_text.split()),
                    },
                })
                chunk_index += 1

        logger.info(f"Created {len(all_chunks)} chunks from {len(pages)} pages")
        return all_chunks

    def _clean_text(self, text: str) -> str:
        """
        Cleans extracted PDF text by removing common artifacts.
        """
        import re
        # Replace multiple newlines with double newline
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Replace multiple spaces with single space
        text = re.sub(r" {2,}", " ", text)
        # Remove non-printable characters
        text = re.sub(r"[^\x20-\x7E\n]", " ", text)
        return text.strip()

    async def process_pdf_local(self, file_path: str) -> list[dict]:
        """
        Full pipeline: read from local disk → extract → chunk.
        Used for local development without AWS S3.
        """
        logger.info(f"Reading PDF from local path: {file_path}")
        async with aiofiles.open(file_path, "rb") as f:
            pdf_bytes = await f.read()

        pages = self.extract_text_with_metadata(pdf_bytes)

        if not pages:
            raise ValueError("Could not extract any text from the PDF. The file may be scanned or encrypted.")

        chunks = self.create_chunks(pages)

        if not chunks:
            raise ValueError("Could not generate text chunks from the PDF content.")

        return chunks


# Singleton instance
pdf_processor = PDFProcessorService()
