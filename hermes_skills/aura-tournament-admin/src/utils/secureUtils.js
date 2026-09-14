// secureUtils.js
const crypto = require('crypto');
const { HMAC_MASTER_SECRET, AUDIT_SIGNING_SECRET } = require('../config');

function hmacSha256(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function hmacSign(payloadBase64, key = HMAC_MASTER_SECRET) {
  return hmacSha256(key, payloadBase64);
}

function signAuditEntry(entryBase64) {
  return crypto.createHmac('sha256', AUDIT_SIGNING_SECRET).update(entryBase64).digest('hex');
}

function sha256Base64(data) {
  const hash = crypto.createHash('sha256').update(data).digest();
  return hash.toString('base64');
}

function randomNonce(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  hmacSha256,
  hmacSign,
  sha256Base64,
  randomNonce,
  timingSafeEqual
};
