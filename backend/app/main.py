"""
StudyGenius AI — FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config.settings import get_settings
from app.config.limiter import limiter
from app.database.database import create_tables
from app.api.routes import health
from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chat import router as chat_router
from app.api.routes.generate import router as generate_router
from app.api.routes.history_users import history_router, users_router
from app.api.routes.settings import router as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: log."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    await create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("StudyGenius AI shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered RAG backend — PDF ingestion, chat, and learning content generation.",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
# ── Rate Limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Global Exception Handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log the full stack trace securely on the backend
    logger.error(f"Unhandled exception [{request.method} {request.url}]: {exc}", exc_info=True)
    
    # Mask errors from the client in production
    if settings.ENVIRONMENT == "production":
        return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again later."})
        
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(generate_router, prefix="/api/v1/generate", tags=["Generate"])
app.include_router(history_router, prefix="/api/v1/history", tags=["History"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(settings_router, prefix="/api/v1", tags=["Settings"])
