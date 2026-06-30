# Local Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (local) or Neon account (free tier)
- Yarn package manager

## 1. Start PostgreSQL
Run PostgreSQL locally or create a Neon database.

### Local PostgreSQL
```bash
# Create database
createdb payguard_ai
```

Default connection: `postgresql+asyncpg://postgres:postgres@localhost:5432/payguard_ai`

### Neon (Serverless)
1. Create account at https://neon.tech
2. Create a new project
3. Copy the connection string

## 2. Configure Backend Environment
Create `backend/.env` locally. Do not commit it.

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/payguard_ai
JWT_SECRET=replace-with-secure-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=DEBUG
LOG_DIR=./logs
DEMO_EMAIL=demo@payguard.ai
DEMO_PASSWORD=demo123
```

Or copy the example:
```bash
cp backend/.env.example backend/.env
```

## 3. Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Health check:
```text
http://127.0.0.1:8000/health
```

Tables are created automatically on startup. Demo data is seeded on first run.

## 4. Configure Frontend Environment
Create `frontend/.env` locally:

```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```

Or copy the example:
```bash
cp frontend/.env.example frontend/.env
```

## 5. Run Frontend
```bash
cd frontend
yarn install
yarn start
```

Frontend URL:
```text
http://localhost:3000
```

## 6. Build Frontend
If memory is limited on Windows, use:

```powershell
$env:NODE_OPTIONS='--max_old_space_size=4096'
$env:GENERATE_SOURCEMAP='false'
yarn build
```

## Log Files
Backend logs are written to the `logs/` directory:
- `logs/app.log` — All application events
- `logs/error.log` — Errors only
- `logs/access.log` — HTTP request/response logs

Configure via `LOG_LEVEL` and `LOG_DIR` in `backend/.env`.

## Common Errors
- **Backend fails at startup**: Check `DATABASE_URL` format (must use `postgresql+asyncpg://`) and `JWT_SECRET`.
- **401 errors**: Log in again and verify JWT secret consistency.
- **CORS errors**: Set `CORS_ORIGINS` to the frontend URL.
- **SSL connection error**: Neon requires SSL. The backend handles this automatically — verify your connection string includes `sslmode=require`.
- **Build memory error**: Use `NODE_OPTIONS` and disable source maps.
- **AI/OCR errors**: Verify provider credentials and accepted file type.
