# PayGuard AI — PRD

## Original Problem Statement
Build a production-ready full-stack SaaS for Indian MSMEs called PayGuard AI: track unpaid invoices, score customer risk, generate AI follow-up messages (WhatsApp/Email/Call), maintain proof trail, forecast cashflow, and generate recovery reports.

## Tech Stack (env-aligned substitution from Vue+Postgres)
- Frontend: React 19 + React Router + Tailwind CSS + shadcn/ui + Recharts + sonner
- Backend: FastAPI + Motor (async MongoDB) + JWT (PyJWT) + bcrypt
- AI: Claude Sonnet 4.5 via Emergent Universal LLM Key + rule-based fallback
- Database: MongoDB

## Target Users
1. MSME Business Owner  2. Accounts Team  3. Sales Team  4. Freelancer / Agency Owner  5. Manufacturer / Trader

## Architecture
- Backend modules: `server.py` (routes), `models.py`, `auth_utils.py` (JWT+bcrypt), `ai_service.py` (LLM + risk scoring + report), `seed.py` (Patel Industrial Supplies demo)
- Frontend: routed under `/` (public) and `/app/*` (protected). Auth context stores JWT in localStorage as `pg_token`.

## Implemented (2026-02-28)
- [x] JWT email/password auth (register, login, /me)
- [x] Dashboard: 8 KPI cards + 5 charts (pending vs recovered, status distribution, monthly trend, top overdue, risk distribution)
- [x] Customers CRUD with risk scoring + risk explanation + AI recovery report
- [x] Invoices CRUD with auto status detection (Sent/Due Soon/Due Today/Overdue/Partially Paid/Paid/Disputed/Escalated), search, filter
- [x] Payments record + auto-flip invoice to Paid + recalculate pending
- [x] Smart Recovery Timeline (6 visual steps: 3d-before / due / 3d / 7d / 15d / 30d overdue)
- [x] AI Follow-up Generator: tone × type matrix → WhatsApp + email subject/body + call script (Claude Sonnet 4.5 with rule-based fallback)
- [x] Follow-up history / proof trail (channel, tone, status, broken-promise tracking)
- [x] Customer Risk Score 0-100 (Low/Medium/High/Critical) with reason + suggested action
- [x] AI Recovery Report (customer + invoice levels) with Copy button
- [x] Cashflow Forecast (this week / this month / high-risk pending / likely delayed / best & worst case) risk-weighted
- [x] Settings (default terms, tone, channels, AI provider)
- [x] Profile page
- [x] Landing page (hero, problem, solution, how-it-works, benefits, contest pitch, CTA)
- [x] Auto-seeded demo (Patel Industrial Supplies + 5 customers + 5 invoices + follow-ups + broken promises)
- [x] Indian rupee formatting (₹1,25,000) everywhere
- [x] Forest-green premium design with Outfit/Manrope fonts (no AI-slop purple/violet)

## Demo Credentials
- demo@payguard.ai / demo123 (Patel Industrial Supplies)

## Future Scope (P1)
- WhatsApp Business API send integration
- Email automation (Resend/SendGrid)
- Razorpay UPI payment-link generation
- Invoice PDF OCR / GST invoice import
- Tally / Zoho Books integration
- MSME Samadhaan & legal-notice draft
- Multi-user team access with role-based permissions
- Mobile app

## Next Action Items
- Deeper end-to-end testing of add-customer, add-invoice, add-payment, save-followup flows
- Add empty-state illustrations on Customers/Invoices when no data
- Optional: SMS reminders via Twilio
