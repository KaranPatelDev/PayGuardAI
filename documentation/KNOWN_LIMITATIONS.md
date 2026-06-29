# Known Limitations

## Current Implementation Limitations
- The repository frontend is React, not Vue.js.
- The repository database is MongoDB, not PostgreSQL.
- WhatsApp, SMS, and email reminders are generated/recorded but not fully sent automatically through external provider APIs.
- Payment gateway links such as Razorpay or UPI links are not implemented yet.
- Role-based access control is not implemented yet.
- Multi-user business accounts are not implemented yet.
- Audit logs are recommended but not implemented as a dedicated module.
- AI-generated messages and reports should be reviewed by a human before use.
- Demo environments should not be used for real private customer financial data.

## Operational Limitations
- Recovery depends on customer response and actual payment behavior.
- Risk scoring is useful for prioritization but should not be treated as a legal or credit bureau score.
- OCR extraction may need manual correction depending on invoice quality.
- Cashflow forecast is an estimate, not a guaranteed payment schedule.

## Recommended Mitigations
- Add provider integrations for WhatsApp, SMS, and email.
- Add payment links for easier collection.
- Add audit logging and export controls.
- Add role-based access before team use.
- Add backup and restore procedures before production finance use.
- Add screenshots and sample walkthrough data for demos.
