from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.config.settings import get_settings

settings = get_settings()
router = APIRouter()


@router.get("/health", response_model=dict, summary="Health Check")
async def health_check() -> JSONResponse:
    """
    Liveness probe endpoint.
    Returns service status — used by load balancers and deployment checks.
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        },
    )
