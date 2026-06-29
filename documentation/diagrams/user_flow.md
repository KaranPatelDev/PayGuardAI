# User Flow Diagram

```mermaid
flowchart TD
    A[User Visits Platform] --> B[Registers or Logs In]
    B --> C[Accesses Dashboard]
    C --> D[Adds Client / Invoice Details]
    D --> E[Views Pending Invoices]
    E --> F[Tracks Follow-up Status]
    F --> G[Marks Invoice as Paid or Pending]
    G --> H[Reviews Recovery Insights]
```

## Explanation
The user starts with authentication, then manages customers and invoices, monitors pending amounts, records follow-up actions, updates payment status, and reviews dashboard insights.

## Business Meaning
This journey turns payment recovery from a scattered manual task into a repeatable workflow.

## Technical Meaning
Each step maps to protected frontend routes and FastAPI endpoints for customers, invoices, payments, follow-ups, dashboard, and reports.
