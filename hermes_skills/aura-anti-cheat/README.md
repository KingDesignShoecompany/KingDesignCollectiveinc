# anti-cheat skill directory

This directory contains templates and code examples to implement anti-cheat systems for Aura Champions.

## How to use
1. Run the SQL migration in `migrations/001_anti_cheat_schema.sql`.
2. Configure environment variables in `src/config.js`.
3. Install dependencies: `npm init -y && npm install express pg body-parser crypto jsonwebtoken winston`.
4. Start the service: `node src/app.js`.
5. Use the Postman collection in `examples/postman_anti_cheat_collection.json` to test endpoints.

## Key environment variables
- `DATABASE_URL`
- `HMAC_MASTER_SECRET`
- `JWT_SECRET`
- `AUDIT_SIGNING_SECRET`

## Operational notes
- Rotate HMAC keys periodically.
- Keep nonce TTL short (recommended 30-60 seconds).
- Archive audit logs to immutable storage for tournament disputes.
