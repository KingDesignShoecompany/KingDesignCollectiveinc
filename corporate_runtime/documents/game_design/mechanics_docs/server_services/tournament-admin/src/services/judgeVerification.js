// judgeVerification.js
const db = require('../../anti-cheat/src/db');
const { hmacSha256 } = require('../../anti-cheat/src/utils/secureUtils');
const config = require('../../anti-cheat/src/config');

async function verifyCardForTournament(cardUid, judgeId) {
  const reg = await db.query('SELECT * FROM card_registry WHERE card_uid=$1', [cardUid]);
  if (reg.rowCount === 0) {
    return { status: 'INVALID', reason: 'Not in registry' };
  }
  const proof = {
    cardUid,
    cardId: reg.rows[0].card_id,
    registryMatch: true,
    judgeId,
    timestamp: new Date().toISOString()
  };
  const proofJson = JSON.stringify(proof);
  const signature = hmacSha256(config.AUDIT_SIGNING_SECRET, proofJson);
  const signedProof = { ...proof, signature };

  await db.query(
    'INSERT INTO judge_verifications(card_uid, judge_id, status, proof_payload) VALUES($1,$2,$3,$4)',
    [cardUid, judgeId, 'OK', signedProof]
  );

  return { status: 'OK', proof: signedProof };
}

module.exports = { verifyCardForTournament };
