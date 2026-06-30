# Database Documentation

## Database Used
The backend uses **PostgreSQL** via the Neon serverless platform, connected through SQLAlchemy's async engine with the `asyncpg` driver.

## Connection Configuration
- **Connection string format**: `postgresql+asyncpg://user:pass@host/db?sslmode=require`
- **Environment variable**: `DATABASE_URL`
- **Connection pooling**: SQLAlchemy `create_async_engine` with `pool_size=10`, `max_overflow=20`
- **SSL handling**: `sslmode` and `channel_binding` query parameters are automatically stripped from the URL and SSL is configured via `connect_args` (asyncpg does not support these query parameters directly)

## Tables

### users
Purpose: Stores registered business users.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PRIMARY KEY |
| full_name | String | NOT NULL |
| email | String | NOT NULL, UNIQUE |
| phone | String | default "" |
| business_name | String | NOT NULL |
| business_type | String | default "" |
| gst_number | String | default "" |
| password_hash | String | NOT NULL |
| created_at | String | NOT NULL |
| updated_at | String | NOT NULL |

Relationships: One user owns customers, invoices, payments, follow-ups, and settings via `user_id`.

### settings
Purpose: Stores user-level business settings.
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PRIMARY KEY, AUTO_INCREMENT |
| user_id | String | FOREIGN KEY → users.id, UNIQUE, NOT NULL |
| default_payment_terms | Integer | default 30 |
| default_followup_tone | String | default "Professional" |
| default_reminder_days | Text | default "[-3, 0, 3, 7, 15, 30]" |
| reminder_channels | Text | default '["WhatsApp", "Email"]' |
| currency | String | default "INR" |
| ai_provider | String | default "claude-sonnet-4-6" |
| updated_at | String | NOT NULL |

### customers
Purpose: Stores client/customer records and risk metadata.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PRIMARY KEY |
| user_id | String | FOREIGN KEY → users.id, NOT NULL, INDEXED |
| business_name | String | NOT NULL |
| contact_person | String | default "" |
| email | String | default "" |
| phone | String | default "" |
| address | String | default "" |
| city | String | default "" |
| state | String | default "" |
| gst_number | String | default "" |
| payment_terms | Integer | default 30 |
| credit_limit | Float | default 0 |
| notes | String | default "" |
| risk_score | Integer | default 0 |
| risk_category | String | default "Low Risk" |
| risk_reason | String | default "" |
| risk_action | String | default "" |
| created_at | String | NOT NULL |
| updated_at | String | NOT NULL |

### invoices
Purpose: Stores invoices and recovery status.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PRIMARY KEY |
| user_id | String | FOREIGN KEY → users.id, NOT NULL, INDEXED |
| customer_id | String | FOREIGN KEY → customers.id, NOT NULL, INDEXED |
| invoice_number | String | NOT NULL |
| invoice_date | String | NOT NULL |
| due_date | String | NOT NULL |
| amount | Float | NOT NULL |
| tax_amount | Float | default 0 |
| total_amount | Float | default 0 |
| paid_amount | Float | default 0 |
| pending_amount | Float | default 0 |
| payment_terms | Integer | default 30 |
| description | String | default "" |
| status | String | default "Sent" |
| file_url | String | default "" |
| created_at | String | NOT NULL |
| updated_at | String | NOT NULL |

### payments
Purpose: Stores payments recorded against invoices.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PRIMARY KEY |
| invoice_id | String | FOREIGN KEY → invoices.id, NOT NULL, INDEXED |
| customer_id | String | FOREIGN KEY → customers.id, NOT NULL, INDEXED |
| user_id | String | FOREIGN KEY → users.id, NOT NULL, INDEXED |
| amount | Float | NOT NULL |
| payment_date | String | NOT NULL |
| payment_mode | String | default "UPI" |
| reference_number | String | default "" |
| notes | String | default "" |
| created_at | String | NOT NULL |

### followups
Purpose: Stores follow-up activity and customer responses.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PRIMARY KEY |
| invoice_id | String | FOREIGN KEY → invoices.id, NOT NULL, INDEXED |
| customer_id | String | FOREIGN KEY → customers.id, NOT NULL, INDEXED |
| user_id | String | FOREIGN KEY → users.id, NOT NULL, INDEXED |
| followup_type | String | NOT NULL |
| message | Text | NOT NULL |
| email_subject | String | default "" |
| email_body | Text | default "" |
| call_script | Text | default "" |
| channel | String | default "WhatsApp" |
| tone | String | default "Professional" |
| status | String | default "Drafted" |
| promised_payment_date | String | NULLABLE |
| customer_response | String | default "" |
| created_at | String | NOT NULL |

## Relationships
```
users 1──M customers
users 1──M invoices (via user_id)
users 1──M payments (via user_id)
users 1──M followups (via user_id)
users 1──1 settings
customers 1──M invoices
customers 1──M payments
customers 1──M followups
invoices 1──M payments
invoices 1──M followups
```

## Table Creation
Tables are created automatically on backend startup via SQLAlchemy's `Base.metadata.create_all`. No manual migration is required.

## Demo Seed Data
Demo data is seeded automatically on first startup via `seed.py`. The seed is idempotent — it skips if the demo user already exists. Demo credentials: `demo@payguard.ai` / `demo123`.
