# Database Documentation

## Actual Database Used
The current backend uses **MongoDB**, not PostgreSQL. The connection is created with `AsyncIOMotorClient` using `MONGO_URL` and `DB_NAME` environment variables.

## Why MongoDB Fits the Current Implementation
MongoDB works well for this version because customer, invoice, payment, follow-up, settings, and AI-generated content are document-oriented and can evolve quickly during product development.

## Existing Collections

### users
Purpose: Stores registered business users.
Important fields: `id`, `full_name`, `email`, `phone`, `business_name`, `business_type`, `gst_number`, `password_hash`, `created_at`, `updated_at`.
Relationships: One user owns customers, invoices, payments, follow-ups, and settings through `user_id`.

### settings
Purpose: Stores user-level business settings.
Important fields: `user_id`, `default_payment_terms`, `default_followup_tone`, `default_reminder_days`, `reminder_channels`, `currency`, `ai_provider`, `updated_at`.

### customers
Purpose: Stores client/customer records and risk metadata.
Important fields: `id`, `user_id`, `business_name`, `contact_person`, `email`, `phone`, `address`, `city`, `state`, `gst_number`, `payment_terms`, `credit_limit`, `notes`, `risk_score`, `risk_category`, `risk_reason`, `risk_action`, `created_at`, `updated_at`.

### invoices
Purpose: Stores invoices and recovery status.
Important fields: `id`, `user_id`, `customer_id`, `invoice_number`, `invoice_date`, `due_date`, `amount`, `tax_amount`, `payment_terms`, `description`, `total_amount`, `paid_amount`, `pending_amount`, `status`, `file_url`, `created_at`, `updated_at`.

### payments
Purpose: Stores payments recorded against invoices.
Important fields: `id`, `user_id`, `customer_id`, `invoice_id`, `amount`, `payment_date`, `payment_mode`, `reference_number`, `notes`, `created_at`.

### followups
Purpose: Stores follow-up activity and customer responses.
Important fields: `id`, `user_id`, `customer_id`, `invoice_id`, `followup_type`, `message`, `channel`, `tone`, `status`, `email_subject`, `email_body`, `call_script`, `promised_payment_date`, `customer_response`, `created_at`.

## Recommended Future Schema
If the project migrates to PostgreSQL, recommended relational tables include:

- Users
- Clients
- Invoices
- Payments
- FollowUps
- RecoveryStatus
- Notifications
- AuditLogs

See [Database ER Diagram](diagrams/database_er_diagram.md) for a relational model.
