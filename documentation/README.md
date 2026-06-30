# Invoice Recovery / Payment Follow-up Automation Platform Documentation

## Project Name
Invoice Recovery / Payment Follow-up Automation Platform, implemented in this repository as **PayGuard AI**.

## Short Description
PayGuard AI helps businesses track unpaid invoices, monitor overdue customers, record payment follow-ups, generate AI-assisted recovery messages, and improve cashflow visibility.

## Product Purpose
The product is built for businesses that sell goods or services on credit and need a disciplined way to manage receivables. Instead of depending on spreadsheets, phone memory, or scattered WhatsApp conversations, the platform centralizes customer, invoice, payment, follow-up, risk, report, and cashflow information.

## Market Problem
Delayed payments are a common operational problem for SMEs, agencies, wholesalers, distributors, consultants, and B2B vendors. Manual follow-up creates missed reminders, weak tracking, poor visibility into unpaid bills, and cashflow pressure.

## Solution Offered
The platform provides:

- Centralized customer and invoice records
- Due-date and overdue status tracking
- Payment recording and mark-as-paid workflows
- Follow-up history and customer response tracking
- AI-generated follow-up messages, risk summaries, invoice parsing, and recovery reports
- Dashboard, charts, customer risk categories, and cashflow forecasts

## Key Features
### Existing Features
- User registration, login, JWT authentication, and profile access
- Customer management
- Invoice creation, editing, deletion, filtering, due-date status calculation, and AI invoice upload parsing
- Payment recording and invoice balance updates
- Follow-up creation, update, customer response tracking, and AI follow-up content generation
- Dashboard KPIs and charts
- Customer risk scoring based on overdue invoices and follow-up behavior
- Cashflow forecast
- Settings for payment terms, reminder days, channels, currency, and AI provider
- Protected in-app "How to Use" page

### Recommended / Planned Features
- Automated WhatsApp, SMS, and email sending
- Razorpay or UPI payment links
- Role-based access control
- PostgreSQL relational schema if the project migrates from MongoDB
- Advanced audit logs, reporting exports, and backup workflows

## Target Users
- Small and medium businesses
- Wholesalers and distributors
- Agencies and consultants
- Accountants and finance teams
- Service businesses and B2B vendors
- Local traders and manufacturers

## Benefits for Businesses
- Faster payment collection discipline
- Better visibility into pending and overdue invoices
- Reduced manual calling and follow-up workload
- Improved cashflow planning
- Organized receivable management
- Better customer risk awareness

## Actual Tech Stack in This Repository
- Frontend: React 19, React Router, Tailwind CSS, shadcn/ui, Recharts, lucide-react
- Backend: FastAPI, SQLAlchemy async, asyncpg
- Database: PostgreSQL (Neon serverless)
- Authentication: JWT bearer tokens with bcrypt password hashing
- Logging: Structured JSON logging with rotating file handlers
- Deployment: Render (backend) + Vercel (frontend) + Neon (database)

## Demo Account
```text
Email: demo@payguard.ai
Password: demo123
```

Do not enter real customer financial data in a demo or staging environment.
```text
documentation/
├── README.md
├── PROJECT_OVERVIEW.md
├── PRODUCT_DOCUMENTATION.md
├── USER_GUIDE.md
├── BUSINESS_VALUE.md
├── MARKET_PROBLEM_AND_SOLUTION.md
├── TECHNICAL_ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── DATABASE_DOCUMENTATION.md
├── FRONTEND_DOCUMENTATION.md
├── BACKEND_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
├── SECURITY_AND_PRIVACY.md
├── FUTURE_ENHANCEMENTS.md
├── FEATURE_USAGE_GUIDE.md
├── LOCAL_SETUP.md
├── KNOWN_LIMITATIONS.md
├── JUDGE_DEMO_GUIDE.md
├── FAQ.md
├── diagrams/
└── assets/screenshots/
```

## Documentation Index
- [Project Overview](PROJECT_OVERVIEW.md)
- [Product Documentation](PRODUCT_DOCUMENTATION.md)
- [User Guide](USER_GUIDE.md)
- [Business Value](BUSINESS_VALUE.md)
- [Market Problem and Solution](MARKET_PROBLEM_AND_SOLUTION.md)
- [Technical Architecture](TECHNICAL_ARCHITECTURE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Database Documentation](DATABASE_DOCUMENTATION.md)
- [Frontend Documentation](FRONTEND_DOCUMENTATION.md)
- [Backend Documentation](BACKEND_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Security and Privacy](SECURITY_AND_PRIVACY.md)
- [Future Enhancements](FUTURE_ENHANCEMENTS.md)
- [Feature Usage Guide](FEATURE_USAGE_GUIDE.md)
- [Local Setup](LOCAL_SETUP.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Judge Demo Guide](JUDGE_DEMO_GUIDE.md)
- [FAQ](FAQ.md)

## Demo Account
Use this only if the deployed demo environment is intended for public testing:

```text
Email: demo@payguard.ai
Password: demo123
```

Do not enter real customer financial data in a demo or staging environment.

## Diagram Index
- [System Architecture](diagrams/system_architecture.md)
- [User Flow](diagrams/user_flow.md)
- [Business Flow](diagrams/business_flow.md)
- [Invoice Recovery Flow](diagrams/invoice_recovery_flow.md)
- [Data Flow](diagrams/data_flow.md)
- [Backend API Flow](diagrams/backend_api_flow.md)
- [Database ER Diagram](diagrams/database_er_diagram.md)
- [Deployment Flow](diagrams/deployment_flow.md)

## How to Read This Documentation
Business owners should start with Project Overview, Business Value, and User Guide. Developers should start with Technical Architecture, API Documentation, Database Documentation, Frontend Documentation, and Backend Documentation. Judges, investors, and clients should review Market Problem and Solution, Business Value, Product Documentation, and the diagrams.
