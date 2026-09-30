// issueNonce.js
const express = require('express');
const router = express.Router();
const { issueNonce } = require('../services/nonceService');
const hmacAuth = require('../middleware/hmacAuth');
const logger = require('../utils/logger');

/**
 * POST /issueNonce
 * body: { battleId }
 * Auth: requires x-signature / x-timestamp / x-session-key-id
 * returns: { nonce, expiresAt }
 */
router.post('/', hmacAuth, async (req, res) => {
  const { battleId } = req.body;
  if (!battleId) return res.status(400).json({ error: 'Missing battleId' });

  try {
    const issuedTo = req.user && req.user.id;
    if (!issuedTo) return res.status(401).json({ error: 'Unauthorized' });
    const result = await issueNonce({ battleId, userId: issuedTo });
    return res.json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
