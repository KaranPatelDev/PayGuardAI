# Backend API Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Performs action
    Frontend->>Backend: Sends API request
    Backend->>Backend: Validates request
    Backend->>Database: Reads/Writes data
    Database-->>Backend: Returns result
    Backend-->>Frontend: Sends API response
    Frontend-->>User: Displays updated information
```

## Explanation
Every protected action sends a JWT-authenticated request. The backend validates the token, validates input, runs business logic, performs database operations, and returns a response.

## Business Meaning
Users see current payment and recovery data after every operation.

## Technical Meaning
This is the standard request-response lifecycle for the REST API.
