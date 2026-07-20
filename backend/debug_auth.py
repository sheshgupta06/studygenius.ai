import asyncio
from httpx import AsyncClient
from app.main import app

async def run():
    async with AsyncClient(app=app, base_url='http://test') as ac:
        r = await ac.post('/api/v1/auth/register', json={
            'email': 'test@example.com',
            'password': 'securepassword123',
            'full_name': 'Test User'
        })
        print('register', r.status_code, r.text)
        r2 = await ac.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        print('login', r2.status_code, r2.text)

if __name__ == '__main__':
    asyncio.run(run())
