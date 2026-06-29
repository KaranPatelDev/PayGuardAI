# Product Documentation

## Product Summary
PayGuard AI is a receivables management workspace for invoice recovery. It combines operational tracking with AI-assisted communication and reporting.

## Existing Product Modules
### Authentication
Users can register, log in, access profile information, and use protected app routes. Authentication uses JWT bearer tokens and bcrypt password hashing.

### Dashboard
The dashboard shows total invoiced amount, pending amount, overdue amount, recovered amount, high-risk customers, average delay, collection rate, customer count, charts, recovery trends, and top overdue customers.

### Customers
Users can create, update, view, delete, and search customers. Customer records include business details, contact details, GST number, payment terms, credit limit, notes, and computed risk information.

### Invoices
Users can create, update, delete, view, filter, and search invoices. Invoice status is calculated from due date, paid amount, pending amount, and manual statuses such as Disputed or Escalated. The app also supports PDF/image upload for AI invoice field extraction.

### Payments
Users can record payments against invoices. Payments update invoice paid amount, pending amount, and status.

### Follow-ups
Users can create follow-up records, update follow-up status, record customer responses, and store promised payment dates. AI can generate follow-up messages, email subjects/bodies, or call scripts depending on request type.

### AI Recovery Tools
Existing AI capabilities include invoice parsing, follow-up generation, risk summary generation, and recovery report generation.

### Cashflow Forecast
The app estimates expected recovery based on pending invoices and customer risk category.

### Reports
Reports are available in the frontend for recovery analysis. Backend AI report generation supports customer-level or invoice-level recovery reports.

### Settings
Users can configure payment terms, follow-up tone, reminder days, reminder channels, currency, and AI provider.

### How to Use
A protected How to Use page explains the product, problem, target users, workflow, step-by-step usage, benefits, real-world example, and FAQs.

## Existing vs Recommended Features
Existing features are implemented in the repository and documented as current behavior. Recommended features such as automatic WhatsApp sending, payment links, role-based access, audit logging, and PostgreSQL migration are listed separately in future-focused sections.

## Feature Status Table

| Feature | Status | Notes |
|---|---|---|
| Registration and login | Implemented | JWT authentication with bcrypt password hashing |
| Customer management | Implemented | Create, view, update, delete, search, and risk metadata |
| Invoice management | Implemented | Create, view, update, delete, filter, auto-status calculation |
| AI invoice upload parsing | Implemented | Supports PDF/image upload for field extraction |
| Payment recording | Implemented | Updates invoice paid and pending amounts |
| Mark invoice paid | Implemented | Creates manual payment for pending balance |
| Follow-up records | Implemented | Stores messages, channel, tone, status, response, promise date |
| AI follow-up generation | Implemented | Generates recovery communication content |
| Dashboard analytics | Implemented | KPIs, charts, trends, overdue customers |
| Customer risk scoring | Implemented | Based on overdue invoices and follow-up behavior |
| Cashflow forecast | Implemented | Estimates expected recovery using due dates and risk |
| Recovery report generation | Implemented | AI report by customer or invoice |
| Public How to Use page | Implemented | Available at `/how-to-use` |
| Protected How to Use page | Implemented | Available at `/app/how-to-use` after login |
| Automated WhatsApp sending | Planned / Recommended | Current app can generate/record messages, not send through provider |
| Automated email/SMS reminders | Planned / Recommended | Requires external provider integration |
| Payment gateway links | Planned / Recommended | Razorpay/UPI links recommended |
| Role-based access control | Planned / Recommended | Needed for multi-user businesses |
| Audit logs | Planned / Recommended | Recommended for production compliance |
| PostgreSQL schema | Planned / Optional | Current code uses MongoDB |

## Screenshots Walkthrough
Recommended screenshot files for `documentation/assets/screenshots/`:

- `landing-page.png`
- `register-login.png`
- `dashboard.png`
- `customers.png`
- `invoices.png`
- `add-invoice-modal.png`
- `ai-followups.png`
- `cashflow.png`
- `reports.png`
- `how-to-use.png`

After adding screenshots, reference them from `USER_GUIDE.md` and this file.
