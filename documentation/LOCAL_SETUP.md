# Local Setup Guide

## Prerequisites
- Node.js and npm
- Python 3.10+
- MongoDB
- Backend environment variables

## 1. Start MongoDB
Run MongoDB locally or connect to a hosted MongoDB instance.

Example local URL:
```text
mongodb://localhost:27017
```

## 2. Configure Backend Environment
Create `backend/.env` locally. Do not commit it.

```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=payguard
JWT_SECRET=replace-with-secure-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000
```

## 3. Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Health check:
```text
http://127.0.0.1:8000/api/
```

## 4. Configure Frontend Environment
Create `frontend/.env` locally:

```bash
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

## 5. Run Frontend
```bash
cd frontend
npm install
npm start
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
npm run build
```

## Common Errors
- Backend fails at startup: check `MONGO_URL`, `DB_NAME`, and `JWT_SECRET`.
- 401 errors: log in again and verify JWT secret consistency.
- CORS errors: set `CORS_ORIGINS` to the frontend URL.
- Build memory error: use `NODE_OPTIONS` and disable source maps.
- AI/OCR errors: verify provider credentials and accepted file type.
