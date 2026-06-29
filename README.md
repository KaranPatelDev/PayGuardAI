# PayGuard AI

AI-native payment recovery and cashflow assistant for Indian MSMEs, freelancers, agencies, traders, and manufacturers.

## Problem Solved
Indian businesses lose cashflow because invoice follow-ups happen manually across WhatsApp, calls, emails, and Excel. PayGuard AI turns recovery into an AI-native workflow: track unpaid invoices, score customer risk, generate professional follow-ups, maintain proof trail, and forecast cashflow.

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS, shadcn/ui, Recharts, sonner, lucide-react
- **Backend**: FastAPI, Motor (async MongoDB), PyJWT, bcrypt
- **AI**: Claude Sonnet 4.5 via Emergent Universal LLM Key (with rule-based fallback)
- **DB**: MongoDB

## Demo
- URL: see `REACT_APP_BACKEND_URL` (preview is configured)
- Email: `demo@payguard.ai`
- Password: `demo123`
- Auto-seeded business: **Patel Industrial Supplies** (5 customers, 5 invoices including overdue + paid + due-soon, follow-up history with broken promises)

## Folder Structure
```
/app
├── backend/
│   ├── server.py          # FastAPI app + all routes
│   ├── auth_utils.py      # JWT + bcrypt
│   ├── models.py          # Pydantic models
│   ├── ai_service.py      # Claude + rule-based + risk scoring + report
│   ├── seed.py            # Demo data
│   ├── .env               # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, JWT_SECRET
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.js              # Router + protected routes
    │   ├── context/AuthContext.jsx
    │   ├── lib/{api.js, format.js}
    │   ├── components/app/{AppShell.jsx, Badges.jsx}
    │   ├── components/ui/      # shadcn
    │   └── pages/              # 14 pages
    └── .env                    # REACT_APP_BACKEND_URL
```

## Key API Endpoints
- `POST /api/auth/{register,login}`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/customers[/:id]`, `GET /api/customers/:id/risk`
- `GET/POST/PUT/DELETE /api/invoices[/:id]`, `POST /api/invoices/:id/mark-paid`, `GET /api/invoices/:id/timeline`
- `GET/POST /api/payments`, `GET /api/payments/invoice/:id`
- `GET/POST/PUT /api/followups[/:id]`
- `POST /api/ai/{generate-followup, generate-risk-summary, generate-recovery-report}`
- `GET /api/dashboard/{summary, charts, recent-activity}`
- `GET /api/cashflow/forecast`
- `GET/PUT /api/settings`

## Running Locally
Already running under supervisor. To restart:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Future Scope
WhatsApp Business API send, Email/SMS automation, Razorpay UPI links, Invoice PDF OCR, Tally/Zoho Books integration, MSME Samadhaan workflow, legal-notice drafts, multi-user team access, mobile app.
