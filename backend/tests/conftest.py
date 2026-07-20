import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.middlewares.dependencies import get_db
from app.models.orm import Base

# Setup SQLite file database for testing
DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

async def _create_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def _drop_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(autouse=True)
def setup_db():
    asyncio.run(_create_test_db())
    yield
    asyncio.run(_drop_test_db())

@pytest.fixture
def client():
    return TestClient(app)
