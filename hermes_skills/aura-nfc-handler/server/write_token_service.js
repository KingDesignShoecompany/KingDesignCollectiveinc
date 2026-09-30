// write_token_service.js
// Real NFC card provisioning service for Aura Champions.
// Responsibilities:
//   POST /health                -> liveness
//   POST /issueWriteToken      -> HMAC-signed, short-TTL token authorizing a card op
//   POST /validateWriteToken   -> verify token + field allow-list
//   POST /registerCard         -> provision a NTAG216 card into card_registry (uses token)
// Secrets: WRITE_TOKEN_SECRET (from compose). Tokens are payloadB64.signature.
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

const WRITE_TOKEN_SECRET = process.env.WRITE_TOKEN_SECRET || 'replace-with-strong-secret';
const TOKEN_TTL_SECONDS = parseInt(process.env.TOKEN_TTL_SECONDS || '30', 10);

function signPayload(b64) {
  return crypto.createHmac('sha256', WRITE_TOKEN_SECRET).update(b64).digest('hex');
}
function createWriteToken({ cardUid, operation, allowedFields }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    cardUid, operation, allowedFields,
    issuedAt: now, expiresAt: now + TOKEN_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString('hex')
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${b64}.${signPayload(b64)}`;
}
function verifyWriteToken(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = signPayload(b64);
  try { if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null; }
  catch { return null; }
  let payload;
  try { payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); }
  catch { return null; }
  if (!payload.expiresAt || payload.expiresAt < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Issue a write token. Caller must supply a server-validated userId + cardUid.
app.post('/issueWriteToken', (req, res) => {
  const { userId, cardUid, operation } = req.body || {};
  if (!userId || !cardUid || !operation) return res.status(400).json({ error: 'Missing fields' });
  if (!['register', 'fusion', 'update'].includes(operation))
    return res.status(400).json({ error: 'Invalid operation' });
  const allowedFields = operation === 'register'
    ? ['owner_id', 'owner_signature', 'registration_token']
    : ['level', 'xp', 'equipment'];
  const token = createWriteToken({ cardUid, operation, allowedFields });
  res.json({ writeToken: token });
});

app.post('/validateWriteToken', (req, res) => {
  const { token, cardUid, fields } = req.body || {};
  const payload = verifyWriteToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  if (payload.cardUid !== cardUid) return res.status(403).json({ error: 'Card UID mismatch' });
  const allowed = new Set(payload.allowedFields || []);
  for (const f of (fields || [])) if (!allowed.has(f)) return res.status(403).json({ error: 'Field not allowed' });
  res.json({ status: 'OK', payload });
});

// Provision a card into card_registry. Requires a valid 'register' token.
app.post('/registerCard', async (req, res) => {
  const { token, cardUid, cardType, checksum, immutableData } = req.body || {};
  const payload = verifyWriteToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  if (payload.operation !== 'register') return res.status(403).json({ error: 'Token not for register' });
  if (payload.cardUid !== cardUid) return res.status(403).json({ error: 'Card UID mismatch' });
  if (!cardUid || !cardType || !checksum) return res.status(400).json({ error: 'Missing card fields' });

  try {
    // Reject duplicate card_uid (idempotent provisioning).
    const ex = await db.query('SELECT 1 FROM card_registry WHERE card_uid=$1', [cardUid]);
    if (ex.rowCount > 0) return res.status(409).json({ error: 'Card already registered' });

    const cardId = parseInt((immutableData && immutableData.cardId) || '0', 10) || 0;
    const imm = immutableData || {};
    await db.query(
      'INSERT INTO card_registry(card_uid, card_id, card_type, checksum, immutable_data) VALUES($1,$2,$3,$4,$5)',
      [cardUid, cardId, cardType, checksum, imm]
    );
    await db.query(
      'INSERT INTO scans_log(user_id, card_uid, action, payload) VALUES($1,$2,$3,$4)',
      [payload.userId || null, cardUid, 'REGISTER', { cardType, checksum }]
    );
    return res.json({ status: 'OK', cardUid, cardType });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Aura NFC write-token service listening on ${PORT}`));
module.exports = app;
