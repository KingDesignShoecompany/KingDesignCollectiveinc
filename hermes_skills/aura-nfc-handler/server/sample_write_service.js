// sample_write_service.js
// Node.js express snippet to issue and validate write tokens.
// Requires: npm install express body-parser crypto
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
app.use(bodyParser.json());
const WRITE_TOKEN_SECRET = process.env.WRITE_TOKEN_SECRET || 'replace_with_strong_secret';
const TOKEN_TTL_SECONDS = 30;
function signPayload(payloadBase64) {
return crypto.createHmac('sha256', WRITE_TOKEN_SECRET).update(payloadBase64).digest('hex');
}
function createWriteToken({ cardUid, operation, allowedFields }) {
const now = Math.floor(Date.now() / 1000);
const payload = {
cardUid,
operation,
allowedFields,
issuedAt: now,
expiresAt: now + TOKEN_TTL_SECONDS,
nonce: crypto.randomBytes(12).toString('hex')
};
const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
const signature = signPayload(payloadBase64);
return `${payloadBase64}.${signature}`;
}
function verifyWriteToken(token) {
const parts = token.split('.');
if (parts.length !== 2) return null;
const [payloadBase64, signature] = parts;
const expected = signPayload(payloadBase64);
if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
const now = Math.floor(Date.now() / 1000);
if (payload.expiresAt < now) return null;
return payload;
}
// Example endpoint: issue write token for registration
app.post('/issueWriteToken', (req, res) => {
const { userId, cardUid, operation } = req.body;
if (!userId || !cardUid || !operation) return res.status(400).json({ error: 'Missing fields' });
// Validate user ownership, registry, etc. (omitted)
const allowedFields = operation === 'register' ? ['owner_signature','registrationToken'] : ['level','xp','equipment'];
const token = createWriteToken({ cardUid, operation, allowedFields });
res.json({ writeToken: token });
});
// Example endpoint: validate token before server instructs client to write
app.post('/validateWriteToken', (req, res) => {
const { token, cardUid, fields } = req.body;
const payload = verifyWriteToken(token);
if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
if (payload.cardUid !== cardUid) return res.status(403).json({ error: 'Card UID mismatch' });
// Ensure fields subset
const allowed = new Set(payload.allowedFields);
for (const f of fields) if (!allowed.has(f)) return res.status(403).json({ error: 'Field not allowed' });
res.json({ status: 'OK', payload });
});
app.listen(4000, () => console.log('Write token service listening on 4000'));
