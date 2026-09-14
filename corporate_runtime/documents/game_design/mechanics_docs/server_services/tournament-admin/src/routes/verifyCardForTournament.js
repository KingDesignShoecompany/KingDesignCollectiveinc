// verifyCardForTournament.js
const express = require('express');
const router = express.Router();
const { verifyCardForTournament } = require('../services/judgeVerification');

/**
 * POST /verifyCardForTournament
 * body: { cardUid, judgeId }
 */
router.post('/', async (req, res) => {
  const { cardUid, judgeId } = req.body;
  if (!cardUid || !judgeId) return res.status(400).json({ error: 'Missing cardUid or judgeId' });

  try {
    const result = await verifyCardForTournament(cardUid, judgeId);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
