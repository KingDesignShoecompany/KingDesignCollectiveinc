// hmacAuth.js
const crypto = require('crypto');
const { HMAC_MASTER_SECRET } = require('../config');
const { timingSafeEqual, hmacSign } = require('../utils/secureUtils');

/**
 * Expects headers:
 *   x-timestamp: unix seconds
 *   x-signature: hex HMAC over base64(body) + '|' + timestamp using per-session key
 *   x-session-key-id: identifier for session key (optional)
 * This middleware verifies signature and basic timestamp freshness.
 */
module.exports = function (req, res, next) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  if (!signature || !timestamp) {
    return res.status(400).json({ error: 'Missing HMAC headers' });
  }

  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 60) {
    return res.status(400).json({ error: 'Stale timestamp' });
  }

  const payloadBase64 = Buffer.from(JSON.stringify(req.body)).toString('base64');
  const expected = hmacSign(payloadBase64 + '|' + timestamp);

  // In production, derive per-session key from session id or use key lookup.
  // For template, use master secret via secureUtils.hmacSign
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(signature);
  // Length mismatch (e.g. truncated/garbage signature) must NOT throw — reject cleanly.
  if (expectedBuf.length !== sigBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Derive identity from a caller-supplied id header. The HMAC over the body
  // proves the caller is authentic; x-user-id carries the claimed identity.
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Missing x-user-id' });
  }
  req.user = { id: userId };

  next();
};
