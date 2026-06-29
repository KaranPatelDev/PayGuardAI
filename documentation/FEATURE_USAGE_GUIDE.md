# Feature Usage Guide

This guide explains how to use each major feature in the current product.

## 1. Public Landing Page
Purpose: Explains the product value and gives access to login, signup, and the public How to Use page.

How to use:
1. Open the deployed app.
2. Review the problem, features, AI follow-up preview, and benefits.
3. Click `How to Use` for a non-technical guide.
4. Click `Log in` for an existing account or `Get started` to register.

## 2. Public How to Use Page
Purpose: Helps new visitors understand the product before logging in.

How to use:
1. Open `/how-to-use`.
2. Read the product explanation, target users, workflow, quick navigation path, benefits, example, and FAQs.
3. Follow the recommended order: register, add customer, add invoice, track dashboard, manage follow-ups, record payments, review insights.

## 3. Registration
Purpose: Creates a business user account.

How to use:
1. Click `Get started`.
2. Enter owner and business details.
3. Enter a secure password.
4. Submit the form.
5. The system creates default settings and signs the user in.

## 4. Login
Purpose: Authenticates an existing user.

How to use:
1. Click `Log in`.
2. Enter email and password.
3. Submit the form.
4. After successful login, the dashboard opens.

## 5. Dashboard
Purpose: Gives an owner-level summary of receivables and recovery health.

How to use:
1. Open Dashboard.
2. Review total invoiced, pending, overdue, recovered, high-risk customers, average delay, and collection rate.
3. Use charts to understand pending vs recovered, invoice status, monthly recovery trend, overdue customers, and risk distribution.

## 6. Customers
Purpose: Stores and manages client/customer records.

How to use:
1. Open Customers.
2. Add customer details such as business name, contact person, phone, email, GST number, payment terms, credit limit, and notes.
3. Search or filter customers when the list grows.
4. Open a customer detail page to view invoices, payments, follow-ups, and risk.

## 7. Invoices
Purpose: Tracks invoices, due dates, pending amounts, and recovery status.

How to use:
1. Open Invoices.
2. Click `Add invoice`.
3. Select a customer.
4. Enter invoice number, invoice date, due date, amount, tax, and description.
5. Save the invoice.
6. Filter by status such as Sent, Due Soon, Due Today, Overdue, Partially Paid, Paid, Disputed, or Escalated.

## 8. AI Invoice Upload
Purpose: Extracts invoice fields from a PDF or image to reduce manual entry.

How to use:
1. Open Invoices.
2. Click `Add invoice`.
3. Upload a PDF/image invoice.
4. Review extracted fields.
5. Select or confirm the customer.
6. Save only after checking the extracted data.

## 9. Invoice Detail
Purpose: Shows one invoice with customer, payments, follow-ups, status, and recovery timeline.

How to use:
1. Click an invoice number from the invoice list.
2. Review pending amount and overdue days.
3. Check linked payments and follow-ups.
4. Mark the invoice as paid when the balance is recovered.

## 10. Payments
Purpose: Records money received against invoices.

How to use:
1. Open Payments.
2. Create a payment for an invoice.
3. Enter amount, date, payment mode, reference number, and notes.
4. Save the payment.
5. The invoice paid and pending amounts update automatically.

## 11. AI Follow-ups
Purpose: Generates recovery messages and stores follow-up activity.

How to use:
1. Open AI Follow-ups.
2. Select an invoice.
3. Choose tone and message type.
4. Generate the message.
5. Review the AI output before sending externally.
6. Record the follow-up status, customer response, and promised payment date.

Important: Current implementation generates and records follow-up content. Fully automated external WhatsApp/email/SMS sending is planned/recommended.

## 12. Cashflow Forecast
Purpose: Estimates likely recovery based on pending invoices and customer risk.

How to use:
1. Open Cashflow.
2. Review expected recovery this week and this month.
3. Check high-risk pending and likely delayed amounts.
4. Use the forecast for owner-level cash planning.

## 13. Reports
Purpose: Helps review recovery performance and generate recovery context.

How to use:
1. Open Reports.
2. Review recovery data and business insights.
3. Use AI recovery report generation where available for customer-level or invoice-level summaries.

## 14. Settings
Purpose: Controls business defaults.

How to use:
1. Open Settings.
2. Configure default payment terms, follow-up tone, reminder days, reminder channels, currency, and AI provider.
3. Save updates.

## 15. Profile
Purpose: Shows account and business identity details.

How to use:
1. Open Profile from the top-right user area.
2. Review user and business information.

## 16. Logout
Purpose: Ends the current session.

How to use:
1. Click `Log out` from the sidebar.
2. The app clears session token data and returns to the public landing page.
