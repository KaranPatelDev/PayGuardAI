# Known Limitations

## Current Implementation Limitations
- WhatsApp, SMS, and email reminders are generated/recorded but not fully sent automatically through external provider APIs.
- Payment gateway links such as Razorpay or UPI links are not implemented yet.
- Role-based access control is not implemented yet.
- Multi-user business accounts are not implemented yet.
- Audit logs are captured in structured logging but not exposed as a dedicated UI module.
- AI-generated messages and reports should be reviewed by a human before use.
- Demo environments should not be used for real private customer financial data.

## Operational Limitations
- Recovery depends on customer response and actual payment behavior.
- Risk scoring is useful for prioritization but should not be treated as a legal or credit bureau score.
- OCR extraction may need manual correction depending on invoice quality.
- Cashflow forecast is an estimate, not a guaranteed payment schedule.

## Deployment Limitations (Free Tier)
- **Render**: Backend sleeps after 15 minutes of inactivity; first request may take 30-60 seconds (cold start).
- **Neon**: Database suspends after inactivity; connection attempts while suspended may fail.
- **Vercel**: No limitations on the free tier for this use case.
- **Render logging**: Logs are stored in `/tmp` which is ephemeral — logs reset on redeploy.

## Recommended Mitigations
- Add provider integrations for WhatsApp, SMS, and email.
- Add payment links for easier collection.
- Add audit logging UI and export controls.
- Add role-based access before team use.
- Add backup and restore procedures before production finance use.
- Upgrade to paid tiers for production use to eliminate cold starts.
