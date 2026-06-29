# API Documentation

## Base URL
All backend routes are mounted under `/api`.

## Authentication
Protected endpoints require:

```http
Authorization: Bearer <jwt_token>
```

## Curl Examples

### Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@payguard.ai","password":"demo123"}'
```

### Authenticated dashboard request
```bash
curl "http://localhost:8000/api/dashboard/summary" \
  -H "Authorization: Bearer <jwt_token>"
```

## Status Code Pattern
- `200`: Success
- `400`: Bad request or invalid input
- `401`: Missing or invalid token
- `404`: Resource not found
- `500`: Server error
- `502`: AI/OCR provider failure

## Public Endpoints

### GET /api/
Purpose: Health check.

Success response:
```json
{ "app": "PayGuard AI", "status": "ok" }
```

### POST /api/auth/register
Purpose: Register a new user and create default settings.

Request body:
```json
{
  "full_name": "Karan Sharma",
  "email": "owner@example.com",
  "phone": "9999999999",
  "business_name": "ABC Traders",
  "business_type": "Wholesaler",
  "gst_number": "27ABCDE1234F1Z5",
  "password": "StrongPassword123"
}
```

Success response:
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "full_name": "Karan Sharma",
    "email": "owner@example.com",
    "business_name": "ABC Traders",
    "created_at": "2026-06-29T00:00:00+00:00",
    "updated_at": "2026-06-29T00:00:00+00:00"
  }
}
```

Error cases: duplicate email returns `400`.

### POST /api/auth/login
Purpose: Authenticate a user.

Request body:
```json
{ "email": "owner@example.com", "password": "StrongPassword123" }
```

Error cases: invalid credentials return `401`.

## Authenticated Endpoints

### GET /api/auth/me
Purpose: Return current user profile.

### GET /api/customers
Purpose: List customers with invoice totals.
Query parameters: `search`, `risk`.

### POST /api/customers
Purpose: Create customer.

Request body:
```json
{
  "business_name": "Retail Shop A",
  "contact_person": "Amit",
  "email": "amit@example.com",
  "phone": "9999999999",
  "address": "Market Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "gst_number": "27ABCDE1234F1Z5",
  "payment_terms": 30,
  "credit_limit": 100000,
  "notes": "Pays monthly"
}
```

### GET /api/customers/{cid}
Purpose: Get customer with invoices, payments, follow-ups, and totals.

### PUT /api/customers/{cid}
Purpose: Update customer fields.

### DELETE /api/customers/{cid}
Purpose: Delete customer and cascade related invoices, payments, and follow-ups.

### GET /api/customers/{cid}/risk
Purpose: Recalculate and return customer risk.

### GET /api/invoices
Purpose: List invoices with status, overdue days, customer name, and risk.
Query parameters: `status`, `customer_id`, `search`.

### POST /api/invoices
Purpose: Create invoice for an existing customer.

Request body:
```json
{
  "customer_id": "customer-uuid",
  "invoice_number": "INV-1001",
  "invoice_date": "2026-06-01",
  "due_date": "2026-06-30",
  "amount": 50000,
  "tax_amount": 9000,
  "payment_terms": 30,
  "description": "Monthly supply"
}
```

Error cases: missing customer returns `400`.

### GET /api/invoices/{iid}
Purpose: Get invoice with customer, payments, follow-ups, status, and overdue days.

### PUT /api/invoices/{iid}
Purpose: Update invoice fields and recalculate totals/status.

### DELETE /api/invoices/{iid}
Purpose: Delete invoice and related payments/follow-ups.

### POST /api/invoices/{iid}/mark-paid
Purpose: Mark invoice as paid and create a manual payment for pending amount.

### GET /api/invoices/{iid}/timeline
Purpose: Return recommended follow-up timeline around due date.

### GET /api/payments
Purpose: List payments enriched with invoice number and customer name.

### POST /api/payments
Purpose: Record payment and update invoice paid/pending amount.

Request body:
```json
{
  "invoice_id": "invoice-uuid",
  "amount": 10000,
  "payment_date": "2026-06-29",
  "payment_mode": "UPI",
  "reference_number": "UPI123",
  "notes": "Partial payment"
}
```

### GET /api/payments/invoice/{iid}
Purpose: List payments for one invoice.

### GET /api/followups
Purpose: List follow-ups.

### POST /api/followups
Purpose: Create follow-up record.

Request body:
```json
{
  "invoice_id": "invoice-uuid",
  "followup_type": "First overdue reminder",
  "message": "Please confirm payment status.",
  "channel": "WhatsApp",
  "tone": "Professional",
  "status": "Drafted",
  "promised_payment_date": "2026-07-05",
  "customer_response": ""
}
```

### GET /api/followups/invoice/{iid}
Purpose: List follow-ups for one invoice.

### PUT /api/followups/{fid}
Purpose: Update follow-up status, customer response, or promised payment date.

### POST /api/ai/parse-invoice
Purpose: Upload PDF/image and extract invoice fields.
Request type: multipart form with `file`.
Allowed file types: PDF, PNG, JPG, JPEG, WebP. Max size: 10 MB.

### POST /api/ai/generate-followup
Purpose: Generate AI follow-up content for an invoice.

Request body:
```json
{
  "invoice_id": "invoice-uuid",
  "tone": "Professional",
  "message_type": "First overdue reminder"
}
```

### POST /api/ai/generate-risk-summary
Purpose: Recalculate and return customer risk summary.

Request body:
```json
{ "customer_id": "customer-uuid" }
```

### POST /api/ai/generate-recovery-report
Purpose: Generate recovery report for a customer or invoice.

Request body:
```json
{ "customer_id": "customer-uuid" }
```

Alternative:
```json
{ "invoice_id": "invoice-uuid" }
```

### GET /api/dashboard/summary
Purpose: Return KPI summary.

### GET /api/dashboard/charts
Purpose: Return chart data for dashboard.

### GET /api/dashboard/recent-activity
Purpose: Return recent invoices, payments, and follow-ups.

### GET /api/cashflow/forecast
Purpose: Forecast likely collections based on due dates and risk.

### GET /api/settings
Purpose: Return business settings.

### PUT /api/settings
Purpose: Update business settings.

Request body:
```json
{
  "default_payment_terms": 30,
  "default_followup_tone": "Professional",
  "default_reminder_days": [-3, 0, 3, 7, 15, 30],
  "reminder_channels": ["WhatsApp", "Email"],
  "ai_provider": "claude-sonnet-4-6"
}
```

## Recommended Future APIs
- `POST /api/reminders/send-whatsapp`
- `POST /api/reminders/send-email`
- `POST /api/payment-links/razorpay`
- `GET /api/audit-logs`
- `POST /api/imports/excel`
- `GET /api/reports/export`
