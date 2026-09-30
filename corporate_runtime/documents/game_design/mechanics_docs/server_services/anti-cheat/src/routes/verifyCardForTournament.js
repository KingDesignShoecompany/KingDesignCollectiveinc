// verifyCardForTournament.js
const express = require('express');
const router = express.Router();
const { createJudgeProof } = require('../services/judgeVerification');
const db = require('../db');
const hmacAuth = require('../middleware/hmacAuth');

/**
 * POST /verifyCardForTournament
 * body: { cardUid }
 * Auth: x-signature / x-timestamp / x-session-key-id
 * Returns signed proof for judge records
 */
router.post('/', hmacAuth, async (req, res) => {
  const { cardUid } = req.body;
  if (!cardUid) return res.status(400).json({ error: 'Missing cardUid' });

  try {
    const q = await db.query('SELECT immutable_data, checksum FROM card_registry WHERE card_uid=$1', [cardUid]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'Card not found in registry' });

    const registrySnapshot = q.rows[0];
    const verifierId = req.user && req.user.id;
    if (!verifierId) return res.status(401).json({ error: 'Unauthorized' });

    const proof = await createJudgeProof({ cardUid, verifierId, registrySnapshot });
    return res.json(proof);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
