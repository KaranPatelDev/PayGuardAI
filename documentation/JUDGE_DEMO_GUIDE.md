# Judge Demo Guide

## Purpose
This guide helps a judge, investor, client, or evaluator understand the product quickly.

## 5-Minute Demo Flow
1. Open the landing page.
2. Click `How to Use` to understand the product workflow.
3. Log in with the demo account if available:

```text
Email: demo@payguard.ai
Password: demo123
```

4. Open Dashboard and review pending, overdue, recovered, and risk metrics.
5. Open Customers and review how customers are organized.
6. Open Invoices and show invoice status tracking.
7. Open one invoice and show payments/follow-ups.
8. Open AI Follow-ups and generate a payment reminder.
9. Open Cashflow and show expected recovery.
10. Open Reports for recovery summary context.

## What Problem to Look For
The product solves delayed invoice payment tracking, manual reminders, weak receivables visibility, scattered follow-up history, and cashflow uncertainty.

## What Makes It Valuable
- Converts manual recovery into a structured workflow
- Gives owners clear receivables visibility
- Reduces follow-up drafting effort with AI
- Helps prioritize risky customers
- Supports Indian SME use cases such as GST, WhatsApp-style communication, credit sales, and distributor/customer follow-up

## What Is Implemented
- Authentication
- Customer management
- Invoice management
- Payment recording
- Follow-up tracking
- AI invoice parsing
- AI follow-up generation
- AI risk summary/report generation
- Dashboard analytics
- Cashflow forecast
- Settings
- Public and protected How to Use pages

## What Is Planned
- Automated WhatsApp/email/SMS sending
- Payment links
- Excel import
- Multi-user roles
- Audit logs
- Advanced exports

## Evaluation Notes
The current repository uses React and MongoDB. If an evaluator expects Vue.js and PostgreSQL, treat those as original project assumptions or future migration options, not current implementation details.
