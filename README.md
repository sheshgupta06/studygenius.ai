# StudyGenius AI - AI Titans

🚀 **Live Demo:** [http://52.66.250.71/](http://52.66.250.71/)

Welcome to **StudyGenius AI**, a premium, production-ready SaaS application that transforms dense PDF documents into interactive, intelligent learning experiences using Large Language Models and Retrieval-Augmented Generation (RAG).

## Overview

StudyGenius AI allows users to upload PDFs and instantly generate:
- **Streaming Chat**: Chat with your document in real-time with exact page citations.
- **Executive Summaries**: High-level overviews and key takeaways.
- **Structured Notes**: Detailed study outlines.
- **Interactive Quizzes**: Multiple-choice assessments with immediate feedback.
- **3D Flashcards**: Spaced repetition study tools.

## Architecture

This project strictly adheres to **Clean Architecture** and SOLID principles to ensure maintainability, scalability, and modularity.

### Frontend
- **Framework**: Vite + React (TypeScript)
- **State Management**: Zustand (Context/Store) & React Query
- **Styling**: Tailwind CSS (Bespoke Design System, Dark/Light Mode)
- **Directory Structure**:
  - `src/layouts/`: Global wrapper components.
  - `src/pages/`: Modular route views.
  - `src/components/`: Reusable UI components.
  - `src/routes/`: React Router configurations and Auth Guards.
  - `src/context/`: Zustand state stores.

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Vector Store**: ChromaDB
- **LLM Engine**: LangChain + OpenAI
- **Directory Structure**:
  - `app/controllers/`: Request/Response formatting and API endpoints.
  - `app/repositories/`: Direct database interactions (SQLAlchemy).
  - `app/rag/`: Deeply granular RAG services (`chat`, `summary`, `notes`, `quiz`, `flashcards`, `embeddings`, `vectorstore`).
  - `app/prompts/`: Centralized LLM prompt templates.
  - `app/models/` & `app/schemas/`: Database ORM models and Pydantic validation schemas.

## Quick Start (Docker)

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your keys (specifically `OPENAI_API_KEY` and AWS credentials).
3. Run the complete stack via Docker Compose:

```bash
docker compose up --build -d
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8080`.

## Manual Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Contributing
Please follow the modular Clean Architecture guidelines when adding new features. Ensure business logic remains decoupled from the HTTP controllers and database repositories.
