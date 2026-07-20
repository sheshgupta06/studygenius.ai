import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def main():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        r = await ac.post('/api/v1/auth/register', json={'email':'verify@example.com','password':'12345678','full_name':'Verify User'})
        print(r.status_code)
        print(r.text)

asyncio.run(main())
