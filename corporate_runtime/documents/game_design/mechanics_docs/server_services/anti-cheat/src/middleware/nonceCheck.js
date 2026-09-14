// nonceCheck.js
const db = require('../db');
/**
 * Middleware to enforce nonce-based replay protection.
 * Expects body.nonce and body.battleId and req.user.id
 * Validates nonce exists, matches battle, issued_to, not used, and not expired.
 * Marks nonce used on success.
 */
module.exports = async function (req, res, next) {
  const { battleId, nonce } = req.body;
  const userId = req.user && req.user.id;
  if (!battleId || !userId || !nonce) {
    return res.status(400).json({ error: 'Missing nonce, battleId, or user' });
  }

  const nonceRes = await db.query('SELECT * FROM nonces WHERE nonce=$1', [nonce]);
  if (nonceRes.rowCount === 0) return res.status(403).json({ error: 'Invalid nonce' });
  const row = nonceRes.rows[0];
  if (row.used) return res.status(403).json({ error: 'Nonce already used' });
  if (row.battle_id && row.battle_id.toString() !== battleId) return res.status(403).json({ error: 'Nonce-battle mismatch' });
  if (row.issued_to && row.issued_to.toString() !== userId) return res.status(403).json({ error: 'Nonce-user mismatch' });
  if (row.expires_at && new Date(row.expires_at) < new Date()) return res.status(403).json({ error: 'Nonce expired' });

  // Mark nonce consumed
  await db.query('UPDATE nonces SET used=TRUE WHERE nonce=$1', [nonce]);

  next();
};
