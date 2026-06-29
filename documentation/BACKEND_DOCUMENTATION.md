# Backend Documentation

## Framework
The backend uses FastAPI and is located in `backend/`.

## Main Files
- `server.py`: FastAPI app, routes, middleware, database connection, startup seed
- `models.py`: Pydantic request/response/domain models
- `auth_utils.py`: JWT and bcrypt helpers
- `ai_service.py`: AI invoice parsing, follow-up generation, risk scoring, and report generation
- `seed.py`: Demo seed data
- `requirements.txt`: Python dependencies

## Routes
Routes are mounted under `/api` and include auth, customers, invoices, payments, follow-ups, AI, dashboard, cashflow, settings, and health check endpoints.

## Database Connection
The backend reads `MONGO_URL` and `DB_NAME` from environment variables and connects to MongoDB using Motor.

## Authentication
Passwords are hashed with bcrypt. Access tokens are JWT tokens signed with `JWT_SECRET` and validated through FastAPI HTTP bearer auth.

## Error Handling
The backend raises `HTTPException` for duplicate registration, invalid credentials, missing resources, invalid files, oversized uploads, and AI/OCR failures.

## Validation
Pydantic models validate request bodies for users, customers, invoices, payments, follow-ups, AI requests, and settings.

## Business Logic
Core logic includes:

- Invoice status calculation from due date and pending amount
- Overdue-day calculation
- Payment amount application to invoice balances
- Customer risk scoring from overdue invoices and follow-up behavior
- Invoice follow-up timeline generation
- Cashflow forecast based on invoice due dates and risk category
- AI-generated follow-up messages and recovery reports

## Running Backend Locally
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Required environment variables:
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=payguard
JWT_SECRET=replace-with-secure-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000
```

Do not commit secrets or production credentials.
