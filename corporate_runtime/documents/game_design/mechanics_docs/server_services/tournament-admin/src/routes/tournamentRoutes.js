// tournamentRoutes.js
const express = require('express');
const router = express.Router();
const { validateTeam, validateDeck, validateSideboardSwap } = require('../services/deckLegality');
const { createMatch, recordResult } = require('../services/tournamentRules');
const { logMatchEvent, logSideboardSwap } = require('../services/matchLogger');
const db = require('../db');

/**
 * POST /tournament/createMatch
 * body: { tournamentId, players: [userId, ...], format }
 */
router.post('/createMatch', async (req, res) => {
  const { tournamentId, players, format } = req.body;
  if (!tournamentId || !Array.isArray(players) || players.length < 2) {
    return res.status(400).json({ error: 'Invalid match request' });
  }

  try {
    const match = await createMatch({ tournamentId, players, format });
    await logMatchEvent({ matchId: match.id, eventType: 'match_created', payload: { players, format } });
    return res.json({ status: 'OK', match });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /tournament/sideboardSwap
 * body: { matchId, playerId, addedCardUids, removedCardUids, roundIndex }
 */
router.post('/sideboardSwap', async (req, res) => {
  const { matchId, playerId, addedCardUids, removedCardUids, roundIndex } = req.body;
  if (!matchId || !playerId || !roundIndex) return res.status(400).json({ error: 'Missing fields' });

  try {
    const mq = await db.query('SELECT * FROM matches WHERE id=$1', [matchId]);
    if (mq.rowCount === 0) return res.status(404).json({ error: 'Match not found' });

    // 5) Sideboard swaps only happen between rounds
    const match = mq.rows[0];
    if (match.status !== 'BETWEEN_ROUNDS') {
      return res.status(403).json({ error: 'Sideboard swaps only allowed between rounds' });
    }

    const swap = await validateSideboardSwap({
      currentDeck: match.deck || [],
      currentSideboard: match.sideboard || [],
      swapCards: addedCardUids
    });
    if (!swap.valid) return res.status(400).json({ error: 'Invalid sideboard swap', details: swap.errors });

    await db.query(
      'UPDATE matches SET sideboard_changes = sideboard_changes || $1::jsonb WHERE id=$2',
      [[{ addedCardUids, removedCardUids, roundIndex, playerId }], matchId]
    );

    await logSideboardSwap({ matchId, playerId, addedCardUids, removedCardUids, roundIndex });
    return res.json({ status: 'OK' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /tournament/recordResult
 * body: { matchId, winnerUserId, resultPayload }
 */
router.post('/recordResult', async (req, res) => {
  const { matchId, winnerUserId, resultPayload } = req.body;
  if (!matchId || !winnerUserId) return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await recordResult({ matchId, winnerUserId, resultPayload });
    await logMatchEvent({ matchId, eventType: 'result_recorded', payload: { winnerUserId, resultPayload } });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
