# Deployment Guide

## Current Deployment Approach
The application is already hosted at https://invoice-recovery-5.emergent.host/. The repository supports a typical split deployment: React frontend, FastAPI backend, and MongoDB database.

## Environment Variables
Backend:
```bash
MONGO_URL=
DB_NAME=
JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=
```

Frontend:
```bash
REACT_APP_BACKEND_URL=
```

AI provider variables may also be required depending on `ai_service.py` integration. Do not expose secret values in documentation or frontend code.

## Frontend Deployment
```bash
cd frontend
npm install
npm run build
```

Deploy the generated build output to the frontend host. Configure `REACT_APP_BACKEND_URL` before building.

## Backend Deployment
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

Use a production process manager or platform service instead of running manually in a terminal.

## Database Deployment
Provision MongoDB, create the database, configure access credentials, and set `MONGO_URL` and `DB_NAME`.

## Production Checklist
- Strong `JWT_SECRET`
- HTTPS-only public access
- Restricted CORS origins
- Secure MongoDB credentials and network access
- Environment variables configured outside source control
- Frontend build points to production backend URL
- Health check returns `{ "app": "PayGuard AI", "status": "ok" }`
- Backups configured
- Monitoring and logs enabled

## Troubleshooting
- 401 errors: verify token storage and `JWT_SECRET`.
- CORS errors: verify `CORS_ORIGINS`.
- Empty dashboard: verify user has customers/invoices or seed data.
- Database connection failure: verify `MONGO_URL` and network access.
- AI/OCR failures: verify provider credentials and upload file type/size.
