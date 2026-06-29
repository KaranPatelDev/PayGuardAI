# Business Flow Diagram

```mermaid
flowchart TD
    A[Business Generates Invoice] --> B[Invoice Payment Pending]
    B --> C[Invoice Added to Platform]
    C --> D[System Tracks Due Date and Status]
    D --> E[Follow-up Action Triggered]
    E --> F[Client Responds / Pays]
    F --> G[Payment Status Updated]
    G --> H[Business Cash Flow Improves]
```

## Explanation
Invoices move from creation to tracking, follow-up, customer response, payment update, and improved cashflow visibility.

## Business Meaning
The business can prioritize unpaid bills and reduce missed recovery actions.

## Technical Meaning
The flow is supported by customer, invoice, follow-up, payment, dashboard, and cashflow APIs.
