// verifyAction.js
const express = require('express');
const router = express.Router();
const hmacAuth = require('../middleware/hmacAuth');
const nonceCheck = require('../middleware/nonceCheck');
const { appendAudit } = require('../services/auditLogger');
const logger = require('../utils/logger');

/**
 * POST /verifyAction
 * body: { battleId, userId, action, stateVersion, nonce }
 * Auth: x-signature / x-timestamp / x-session-key-id via hmacAuth
 *      + nonce replay protection via nonceCheck
 */
router.post('/', hmacAuth, nonceCheck, async (req, res) => {
  const { battleId, userId, action, stateVersion } = req.body;
  if (!battleId || !userId || !action || typeof stateVersion === 'undefined') {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const bq = await require('../db').query('SELECT state_version FROM battles WHERE id=$1', [battleId]);
    if (bq.rowCount === 0) {
      await appendAudit({ eventType: 'action_rejected', userId, battleId, payload: { action }, serverDecision: 'battle_not_found' });
      return res.status(404).json({ error: 'Battle not found' });
    }
    const currentVersion = bq.rows[0].state_version || 0;
    if (stateVersion !== currentVersion) {
      await appendAudit({ eventType: 'action_rejected', userId, battleId, payload: { action }, serverDecision: 'stale_stateVersion' });
      return res.status(409).json({ error: 'Stale stateVersion' });
    }

    await appendAudit({ eventType: 'action_ok', userId, battleId, payload: { action }, serverDecision: 'accepted' });
    return res.json({ status: 'OK' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
