// nonceService.js
const db = require('../db');
const { randomNonce } = require('../utils/secureUtils');
const config = require('../config');

async function issueNonce({ battleId, userId }) {
  const nonce = randomNonce(16);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (config.NONCE_TTL_SECONDS || 60) * 1000);
  await db.query(
    'INSERT INTO nonces(nonce, battle_id, issued_to, issued_at, expires_at, used) VALUES($1,$2,$3,$4,$5,FALSE)',
    [nonce, battleId, userId, now, expiresAt]
  );
  return { nonce, expiresAt };
}

async function consumeNonce(nonce, battleId, userId) {
  const res = await db.query('SELECT * FROM nonces WHERE nonce=$1', [nonce]);
  if (res.rowCount === 0) return { ok: false, reason: 'Invalid nonce' };
  const row = res.rows[0];
  if (row.used) return { ok: false, reason: 'Nonce already used' };
  if (row.battle_id && row.battle_id.toString() !== battleId) return { ok: false, reason: 'Nonce-battle mismatch' };
  if (row.issued_to && row.issued_to.toString() !== userId) return { ok: false, reason: 'Nonce-user mismatch' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { ok: false, reason: 'Nonce expired' };
  await db.query('UPDATE nonces SET used=TRUE WHERE nonce=$1', [nonce]);
  return { ok: true };
}

module.exports = { issueNonce, consumeNonce };
