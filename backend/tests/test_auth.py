import pytest
from httpx import AsyncClient

# We use pytest-asyncio to handle async tests
pytestmark = pytest.mark.asyncio

async def test_register_user(client):
    # The client fixture is a synchronous TestClient,
    # but our auth flows are verified via AsyncClient in the next test.
    response = client.post("/api/v1/auth/register", json={
        "email": "example@test.com",
        "password": "securepassword123",
        "full_name": "Example User"
    })
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "example@test.com"


async def test_register_and_login_flow():
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Register
        res = await ac.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "securepassword123",
            "full_name": "Test User"
        })
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["full_name"] == "Test User"

        # Login
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data
        
        # Profile fetch
        token = login_data["access_token"]
        prof_res = await ac.get("/api/v1/auth/profile", headers={"Authorization": f"Bearer {token}"})
        assert prof_res.status_code == 200
        assert prof_res.json()["email"] == "test@example.com"

async def test_login_invalid_credentials():
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert res.status_code == 401
