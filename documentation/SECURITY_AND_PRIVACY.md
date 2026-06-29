# Security and Privacy

## Authentication Security
The app uses JWT bearer tokens for API access. Passwords are stored as bcrypt hashes, not plain text.

## Password Hashing
`auth_utils.py` uses bcrypt with generated salts. Password verification uses bcrypt comparison.

## Secure API Access
Protected endpoints depend on `get_current_user_id`, which validates the bearer token and extracts the user ID.

## Input Validation
FastAPI and Pydantic validate structured request bodies. File uploads enforce allowed MIME types and a 10 MB limit.

## Database Security
MongoDB credentials must be stored in environment variables. Database network access should be restricted to backend services.

## Environment Variable Protection
Never commit `.env` files, JWT secrets, database credentials, AI keys, or provider tokens.

## Data Privacy
Customer and invoice data may include financial and contact information. Access should be scoped by `user_id`, and exports or reports should avoid exposing data to unauthorized users.

## Demo and Staging Disclaimer
Do not upload real customer financial records, GST data, phone numbers, invoice PDFs, or private payment references to demo or staging environments. Use production environments only when HTTPS, secrets management, database access controls, backups, and privacy policies are configured.

## Recommended Audit Logs
Track login events, customer changes, invoice changes, payment creation, follow-up updates, report generation, and admin/security events.

## Recommended Backup Strategy
Use automated database backups, test restore procedures, and maintain retention policies based on business requirements.

## Recommended Security Improvements
- JWT authentication hardening
- Rate limiting
- Role-based access control
- HTTPS-only access
- Data encryption where needed
- Audit logging
- Backup and restore policy
- API request validation
- Secure CORS configuration
- Refresh token rotation if long sessions are required
- Secrets scanning in CI/CD
