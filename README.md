# PayGuard AI

AI-native payment recovery and cashflow assistant for Indian MSMEs, freelancers, agencies, traders, and manufacturers.

## Problem Solved
Indian businesses lose cashflow because invoice follow-ups happen manually across WhatsApp, calls, emails, and Excel. PayGuard AI turns recovery into an AI-native workflow: track unpaid invoices, score customer risk, generate professional follow-ups, maintain proof trail, and forecast cashflow.

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS, shadcn/ui, Recharts, sonner, lucide-react
- **Backend**: FastAPI, SQLAlchemy async, asyncpg, PyJWT, bcrypt
- **Database**: PostgreSQL (Neon serverless) with connection pooling
- **AI**: Claude Sonnet 4.5 via Emergent Universal LLM Key (with rule-based fallback)
- **Logging**: Structured JSON logging with rotating file handlers

## Demo
- **Backend**: https://payguardai.onrender.com
- **Email**: `demo@payguard.ai`
- **Password**: `demo123`
- **Auto-seeded business**: Patel Industrial Supplies (5 customers, 5 invoices including overdue + paid + due-soon, follow-up history with broken promises)

## Folder Structure
```
├── backend/
│   ├── server.py              # FastAPI app + all routes
│   ├── db.py                  # SQLAlchemy models + async engine
│   ├── auth_utils.py          # JWT + bcrypt
│   ├── models.py              # Pydantic models
│   ├── ai_service.py          # Claude + rule-based + risk scoring + report
│   ├── seed.py                # Demo data
│   ├── logging_config.py      # Structured JSON logging setup
│   ├── middleware.py           # Request logging middleware
│   ├── requirements.txt       # Production dependencies
│   └── .env                   # DATABASE_URL, JWT_SECRET, CORS_ORIGINS
├── frontend/
│   ├── src/
│   │   ├── App.js              # Router + protected routes
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/{api.js, format.js}
│   │   ├── components/app/{AppShell.jsx, Badges.jsx}
│   │   ├── components/ui/      # shadcn
│   │   └── pages/              # 14 pages
│   └── .env                    # REACT_APP_BACKEND_URL
├── logs/                       # Structured JSON log files
│   ├── app.log
│   ├── error.log
│   └── access.log
├── render.yaml                 # Render deployment blueprint
└── documentation/              # Project documentation
```

## Key API Endpoints
- `POST /api/auth/{register,login}`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/customers[/:id]`, `GET /api/customers/:id/risk`
- `GET/POST/PUT/DELETE /api/invoices[/:id]`, `POST /api/invoices/:id/mark-paid`, `GET /api/invoices/:id/timeline`
- `GET/POST /api/payments`, `GET /api/payments/invoice/:id`
- `GET/POST/PUT /api/followups[/:id]`
- `POST /api/ai/{generate-followup, generate-risk-summary, generate-recovery-report, parse-invoice}`
- `GET /api/dashboard/{summary, charts, recent-activity}`
- `GET /api/cashflow/forecast`
- `GET/PUT /api/settings`

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (local or Neon)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # configure DATABASE_URL, JWT_SECRET
uvicorn server:app --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

### Build (Windows)
If memory is limited:
```powershell
$env:NODE_OPTIONS='--max_old_space_size=4096'
$env:GENERATE_SOURCEMAP='false'
yarn build
```

## Deployment
- **Backend**: Deployed on Render (free tier) via `render.yaml` blueprint
- **Frontend**: Deployed on Vercel (free tier)
- **Database**: Neon PostgreSQL (serverless, free tier)

See [Deployment Guide](documentation/DEPLOYMENT_GUIDE.md) for full instructions.

## Structured Logging
The backend uses structured JSON logging with three log files:
- `app.log` — All application events (rotating, 5MB max, 5 backups)
- `error.log` — Errors only
- `access.log` — HTTP request/response logs

Configure via `LOG_LEVEL` and `LOG_DIR` environment variables.

## Future Scope
WhatsApp Business API send, Email/SMS automation, Razorpay UPI links, Invoice PDF OCR, Tally/Zoho Books integration, MSME Samadhaan workflow, legal-notice drafts, multi-user team access, mobile app.
