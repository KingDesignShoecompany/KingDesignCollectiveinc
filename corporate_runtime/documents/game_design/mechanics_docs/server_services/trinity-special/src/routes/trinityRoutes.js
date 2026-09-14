// trinityRoutes.js
const express = require('express');
const router = express.Router();
const { checkTrinity } = require('../services/trinityValidator');

/**
 * POST /trinity/check
 * body: { battleId, state, controllingTeamIndex? }
 * returns: { status, events, stateVersion? }
 */
router.post('/check', async (req, res) => {
  const { battleId, state, controllingTeamIndex } = req.body;
  if (!battleId || !state) return res.status(400).json({ error: 'Missing battleId or state' });

  try {
    const result = checkTrinity(state, controllingTeamIndex);
    if (result.activated) {
      return res.json({
        status: 'ACTIVATED',
        events: result.events,
        stateVersion: state.stateVersion
      });
    }
    return res.json({ status: 'NOT_ACTIVATED' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
