// judgeVerification.js
const db = require('../db');
const { signAuditEntry } = require('../utils/secureUtils');
const config = require('../config');

async function createJudgeProof({ cardUid, verifierId, registrySnapshot }) {
  const proof = {
    cardUid,
    cardId: registrySnapshot.card_id,
    registryMatch: true,
    verifierId,
    verifiedAt: new Date().toISOString()
  };
  const payloadBase64 = Buffer.from(JSON.stringify(proof)).toString('base64');
  const signature = signAuditEntry(payloadBase64);
  const signedProof = `${payloadBase64}.${signature}`;

  await db.query(
    `INSERT INTO judge_verifications(card_uid, verified_by, registry_snapshot, signed_proof, verified_at)
     VALUES($1,$2,$3,$4,now())`,
    [cardUid, verifierId, registrySnapshot, signedProof]
  );

  return { status: 'OK', proof: signedProof };
}

module.exports = { createJudgeProof };
