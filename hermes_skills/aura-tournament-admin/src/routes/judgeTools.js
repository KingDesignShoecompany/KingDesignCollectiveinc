// judgeTools.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/tournamentAuth');

/**
 * POST /judge/overrideResult
 * body: { matchId, newWinnerUserId, reason }
 */
router.post('/overrideResult', auth.requireJudge, async (req, res) => {
  const { matchId, newWinnerUserId, reason } = req.body;
  if (!matchId || !newWinnerUserId) return res.status(400).json({ error: 'Missing fields' });

  try {
    const mq = await db.query('SELECT * FROM matches WHERE id=$1', [matchId]);
    if (mq.rowCount === 0) return res.status(404).json({ error: 'Match not found' });

    await db.query(
      'UPDATE matches SET winner_user_id=$1, judge_override=true, override_reason=$2 WHERE id=$3',
      [newWinnerUserId, reason || 'judge override', matchId]
    );

    return res.json({ status: 'OK', matchId, newWinnerUserId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /judge/flagDispute
 * body: { matchId, reason }
 */
router.post('/flagDispute', auth.requireJudge, async (req, res) => {
  const { matchId, reason } = req.body;
  if (!matchId || !reason) return res.status(400).json({ error: 'Missing fields' });

  try {
    await db.query(
      'INSERT INTO match_disputes(match_id, reason, status) VALUES($1,$2,$3)',
      [matchId, reason, 'OPEN']
    );
    return res.json({ status: 'OK', dispute: 'OPEN' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
