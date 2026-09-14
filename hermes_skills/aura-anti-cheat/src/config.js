// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/aura',
  HMAC_MASTER_SECRET: process.env.HMAC_MASTER_SECRET || 'replace-with-strong-secret',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-jwt-secret',
  AUDIT_SIGNING_SECRET: process.env.AUDIT_SIGNING_SECRET || 'replace-audit-secret',
  NONCE_TTL_SECONDS: parseInt(process.env.NONCE_TTL_SECONDS || '45', 10)
};
