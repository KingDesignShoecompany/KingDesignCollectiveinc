// battleSync.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkTrinity } = require('../trinity-special/src/services/trinityChecker');

/**
 * POST /battleSync
 * body: { battleId, userId, action, nonce, stateVersion }
 */
router.post('/', async (req, res) => {
  const { battleId, userId, action, nonce, stateVersion } = req.body;
  if (!battleId || !userId || !action || !nonce) return res.status(400).json({ error: 'Missing fields' });

  try {
    const nq = await db.query('SELECT * FROM nonces WHERE nonce=$1', [nonce]);
    if (nq.rowCount === 0) return res.status(403).json({ error: 'Invalid nonce' });
    const nrow = nq.rows[0];
    if (nrow.used) return res.status(403).json({ error: 'Nonce already used' });
    if (nrow.battle_id && nrow.battle_id.toString() !== battleId) return res.status(403).json({ error: 'Nonce-battle mismatch' });
    if (nrow.issued_to && nrow.issued_to.toString() !== userId) return res.status(403).json({ error: 'Nonce-user mismatch' });

    await db.query('UPDATE nonces SET used=TRUE WHERE nonce=$1', [nonce]);

    const bq = await db.query('SELECT * FROM battles WHERE id=$1', [battleId]);
    if (bq.rowCount === 0) return res.status(404).json({ error: 'Battle not found' });
    const battle = bq.rows[0];
    const currentVersion = battle.state_version || 0;
    if (stateVersion !== currentVersion) return res.status(409).json({ error: 'Stale stateVersion' });

    // Trinity activation check (server-side authoritative)
    const controllingTeamIndex = Array.isArray(battle.players)
      ? battle.players.findIndex(p => p.userId === userId)
      : 0;
    const trinityResult = checkTrinity(battle.state, controllingTeamIndex >= 0 ? controllingTeamIndex : 0);

    // Placeholder: replace with authoritative resolver logic
    const newVersion = currentVersion + 1;
    const events = [];
    if (trinityResult.active) {
      events.push({
        eventType: 'TRINITY_ACTIVATED',
        effects: trinityResult.effects,
        stateVersion: newVersion
      });
    }

    await db.query('UPDATE battles SET state_version=$1 WHERE id=$2', [newVersion, battleId]);
    await db.query('INSERT INTO battle_events(battle_id, event_index, event) VALUES($1,$2,$3)', [
      battleId,
      newVersion,
      { action, trinity: trinityResult }
    ]);

    return res.json({ status: 'SUCCESS', stateVersion: newVersion, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
