# System Architecture Diagram

```mermaid
flowchart LR
    User[Business User] --> Frontend[React Frontend]
    Frontend --> API[FastAPI REST API]
    API --> Auth[Authentication Module]
    API --> Invoice[Invoice Management Module]
    API --> Recovery[Recovery Tracking Module]
    API --> Dashboard[Dashboard & Analytics Module]
    Auth --> DB[(MongoDB Database)]
    Invoice --> DB
    Recovery --> DB
    Dashboard --> DB
```

## Explanation
The user works through the React frontend. The frontend sends REST requests to the FastAPI backend. Backend modules handle authentication, invoices, recovery tracking, dashboard data, and persistence in MongoDB.

## Business Meaning
The business gets one centralized place to manage customers, invoices, payments, follow-ups, risk, reports, and cashflow.

## Technical Meaning
The architecture separates UI, API, authentication, business logic, and database responsibilities.
