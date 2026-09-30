// exportLogs.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/tournamentAuth');

/**
 * POST /tournament/exportLogs
 * body: { matchId, format? }
 * Requires tournament admin/judge auth
 * Returns match logs as JSON
 */
router.post('/', auth, async (req, res) => {
  const { matchId, format = 'json' } = req.body;
  if (!matchId) return res.status(400).json({ error: 'Missing matchId' });

  try {
    const mq = await db.query('SELECT * FROM matches WHERE id=$1', [matchId]);
    if (mq.rowCount === 0) return res.status(404).json({ error: 'Match not found' });

    const logs = await db.query(
      'SELECT * FROM match_logs WHERE match_id=$1 ORDER BY created_at ASC',
      [matchId]
    );

    const match = mq.rows[0];
    const payload = {
      matchId: match.id,
      tournamentId: match.tournament_id,
      players: match.players,
      results: match.results,
      logs: logs.rows,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      const csv = convertToCsv(payload);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    return res.json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

function convertToCsv(data) {
  const headers = ['matchId', 'tournamentId', 'playerId', 'eventType', 'createdAt'];
  const rows = [headers.join(',')];
  for (const log of data.logs) {
    rows.push([
      data.matchId,
      data.tournamentId,
      log.player_id || '',
      log.event_type || '',
      log.created_at || ''
    ].join(','));
  }
  return rows.join('\n');
}

module.exports = router;
