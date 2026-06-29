# Database ER Diagram

## Current Implementation Note
The current code uses MongoDB collections. The following Mermaid ER diagram represents a recommended relational model if the project later migrates to PostgreSQL.

```mermaid
erDiagram
    USERS ||--o{ CLIENTS : manages
    USERS ||--o{ INVOICES : creates
    CLIENTS ||--o{ INVOICES : has
    INVOICES ||--o{ FOLLOW_UPS : receives
    INVOICES ||--o{ PAYMENTS : has
    INVOICES ||--|| RECOVERY_STATUS : tracks

    USERS {
        string id
        string name
        string email
        string password_hash
        datetime created_at
    }

    CLIENTS {
        string id
        string user_id
        string name
        string email
        string phone
        string company_name
    }

    INVOICES {
        string id
        string user_id
        string client_id
        string invoice_number
        decimal amount
        date due_date
        string status
    }

    FOLLOW_UPS {
        string id
        string invoice_id
        string followup_type
        datetime followup_date
        string status
    }

    PAYMENTS {
        string id
        string invoice_id
        decimal paid_amount
        datetime payment_date
        string payment_mode
    }

    RECOVERY_STATUS {
        string id
        string invoice_id
        string status
        datetime updated_at
    }
```

## Business Meaning
This model keeps business owners, clients, invoices, payments, follow-ups, and recovery status connected.

## Technical Meaning
In MongoDB, these relationships are stored with IDs such as `user_id`, `customer_id`, and `invoice_id`. In PostgreSQL, foreign keys would enforce these relationships.
