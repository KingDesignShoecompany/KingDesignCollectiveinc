// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/aura',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-jwt-secret',
  HMAC_SECRET: process.env.HMAC_SECRET || 'replace-with-strong-secret',
  WRITE_TOKEN_SECRET: process.env.WRITE_TOKEN_SECRET || 'replace-with-strong-secret',
  NONCE_TTL_SECONDS: 45
};
