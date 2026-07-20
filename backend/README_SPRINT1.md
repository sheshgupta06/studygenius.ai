# Sprint 1 — Backend scaffold and migrations

This file documents how to set up the backend for local development and run migrations.

1. Copy `.env.example` -> `.env` and fill values.

2. Create & activate virtualenv (Windows PowerShell example):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Create the Postgres database (example):

```powershell
psql -U postgres -c "CREATE DATABASE studygenius;"
```

4. Run Alembic migrations (first revision):

```powershell
cd backend
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

Note: Alembic uses `app.config.settings` for `DATABASE_URL` when running migrations.

5. Start the application:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
