// trinityEvents.js
const express = require('express');
const router = express.Router();
const { checkTrinity } = require('../services/trinityChecker');
const db = require('../db');

/**
 * POST /checkTrinity
 * body: { battleId, teamIndex }
 */
router.post('/', async (req, res) => {
  const { battleId, teamIndex } = req.body;
  if (typeof teamIndex === 'undefined') return res.status(400).json({ error: 'Missing teamIndex' });

  try {
    const bq = await db.query('SELECT state FROM battles WHERE id=$1', [battleId]);
    if (bq.rowCount === 0) return res.status(404).json({ error: 'Battle not found' });
    const state = bq.rows[0].state;
    const result = checkTrinity(state, teamIndex);
    return res.json({ battleId, teamIndex, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
