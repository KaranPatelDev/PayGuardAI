# Backend Documentation

## Framework
The backend uses FastAPI and is located in `backend/`.

## Main Files
- `server.py`: FastAPI app, all routes, middleware, startup/shutdown, database initialization
- `db.py`: SQLAlchemy async engine, ORM models (User, Customer, Invoice, Payment, Followup, Settings), session management
- `models.py`: Pydantic request/response/domain models
- `auth_utils.py`: JWT and bcrypt helpers
- `ai_service.py`: AI invoice parsing, follow-up generation, risk scoring, and report generation
- `seed.py`: Demo data seeder (idempotent)
- `logging_config.py`: Structured JSON logging setup with rotating file handlers
- `middleware.py`: Request logging middleware and global exception handler
- `requirements.txt`: Production dependencies
- `requirements-dev.txt`: Development/testing dependencies

## Routes
Routes are mounted under `/api` and include:
- Auth: register, login, me
- Customers: CRUD + risk scoring
- Invoices: CRUD + mark-paid, timeline, OCR upload
- Payments: create, list by invoice
- Follow-ups: CRUD
- AI: generate follow-up, risk summary, recovery report, parse invoice
- Dashboard: summary, charts, recent activity
- Cashflow: forecast
- Settings: get/update
- Health: health check

## Database Connection
The backend connects to PostgreSQL (Neon) using SQLAlchemy async with the `asyncpg` driver. The connection string is read from the `DATABASE_URL` environment variable.

**SSL handling**: Neon connection strings include `sslmode=require` which asyncpg doesn't accept as a query parameter. The backend automatically strips `sslmode` and `channel_binding` from the URL and configures SSL via `connect_args`.

**Auto-creation**: Tables are created on startup via `Base.metadata.create_all`.

## Authentication
Passwords are hashed with bcrypt. Access tokens are JWT tokens signed with `JWT_SECRET` and validated through FastAPI HTTP bearer auth.

## Structured Logging
The backend uses structured JSON logging with three log files:
- `app.log` — All application events (rotating, 5MB max, 5 backups)
- `error.log` — Errors only
- `access.log` — HTTP request/response logs

### Log Format
```json
{
  "timestamp": "2026-06-30T12:00:00Z",
  "level": "INFO",
  "logger": "payguard.auth",
  "message": "User login successful",
  "event": "auth.login.success",
  "user_id": "abc123",
  "email": "user@example.com"
}
```

### Sensitive Data Filtering
The `SensitiveFilter` masks sensitive fields in log output: `password`, `password_hash`, `token`, `authorization`, `secret`.

### Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL) | `INFO` |
| `LOG_DIR` | Directory for log files | `./logs` |

## Error Handling
The backend raises `HTTPException` for duplicate registration, invalid credentials, missing resources, invalid files, oversized uploads, and AI/OCR failures. Global exception handlers log all unhandled errors with full context.

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
cp .env.example .env  # configure DATABASE_URL, JWT_SECRET
uvicorn server:app --reload
```

Required environment variables:
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/payguard_ai
JWT_SECRET=replace-with-secure-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
LOG_DIR=./logs
DEMO_EMAIL=demo@payguard.ai
DEMO_PASSWORD=demo123
```

Do not commit secrets or production credentials.
