# Write Token Specification
## Purpose
A `writeToken` is a short-lived, server-signed authorization that allows the client to perform a specific write operation on a specific card. Tokens prevent unauthorized writes and scope what fields can be modified.
## Token format (JSON Web Token style, HMAC-signed)
Payload fields:
- `cardUid` (string)  target NTAG UID
- `operation` (string)  e.g., "register", "fusion_write", "upgrade"
- `allowedFields` (array of strings)  e.g., ["owner_signature","level","xp"]
- `issuedAt` (int)  unix timestamp
- `expiresAt` (int)  unix timestamp (short, e.g., +30 seconds)
- `nonce` (string)  random nonce to prevent replay
Signature:
- HMAC-SHA256 over base64(payload) using server `WRITE_TOKEN_SECRET`.
## Validation rules (server-side)
1. Verify signature using `WRITE_TOKEN_SECRET`.
2. Check `expiresAt` > now.
3. Ensure `cardUid` matches the card being written.
4. Ensure requested write fields are subset of `allowedFields`.
5. Log the write event with `userId`, `cardUid`, `operation`, and `payloadHash`.
## Example token generation (pseudocode)
1. payload = base64(JSON.stringify({...}))
2. signature = HMAC_SHA256(WRITE_TOKEN_SECRET, payload)
3. token = payload + "." + signature
## Security notes
- Keep `WRITE_TOKEN_SECRET` in secure server environment variables.
- Tokens must be single-use for high-risk operations (store used nonces).
- For tournament-level writes, require manual judge approval and longer audit trail.
