// writeToken.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const config = require('../config');

const TOKEN_TTL_SECONDS = 30;
const WRITE_TOKEN_SECRET = config.WRITE_TOKEN_SECRET;

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

/**
 * POST /issueWriteToken
 * body: { userId, cardUid, operation }
 */
router.post('/issueWriteToken', async (req, res) => {
  const { userId, cardUid, operation } = req.body;
  if (!userId || !cardUid || !operation) return res.status(400).json({ error: 'Missing fields' });

  const reg = await db.query('SELECT * FROM card_registry WHERE card_uid=$1', [cardUid]);
  if (reg.rowCount === 0) return res.status(404).json({ error: 'Card not found in registry' });

  const allowedFields = operation === 'register'
    ? ['owner_signature','registrationToken']
    : ['level','xp','equipment'];

  const token = createWriteToken({ cardUid, operation, allowedFields });
  return res.json({ writeToken: token });
});

/**
 * POST /validateWriteToken
 * body: { token, cardUid, fields }
 */
router.post('/validateWriteToken', (req, res) => {
  const { token, cardUid, fields } = req.body;
  const payload = verifyWriteToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  if (payload.cardUid !== cardUid) return res.status(403).json({ error: 'Card UID mismatch' });

  const allowed = new Set(payload.allowedFields);
  for (const f of fields) {
    if (!allowed.has(f)) return res.status(403).json({ error: 'Field not allowed' });
  }

  return res.json({ status: 'OK', payload });
});

module.exports = router;
