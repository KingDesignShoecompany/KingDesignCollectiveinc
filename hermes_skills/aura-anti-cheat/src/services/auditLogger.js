// auditLogger.js
const db = require('../db');
const { sha256Base64 } = require('../utils/secureUtils');

async function appendAudit({ eventType, userId, cardUid, battleId, payload, serverDecision }) {
  const payloadJson = JSON.stringify(payload || {});
  const payloadHash = sha256Base64(payloadJson);

  const last = await db.query('SELECT payload_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  const previousHash = last.rowCount > 0 ? last.rows[0].payload_hash : null;

  await db.query(
    `INSERT INTO audit_logs(event_type, user_id, card_uid, battle_id, payload, payload_hash, server_decision, previous_hash)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [eventType, userId, cardUid, battleId, payloadJson, payloadHash, serverDecision, previousHash]
  );
}

module.exports = { appendAudit };
