// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3003,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://aura:***@localhost:5432/aura',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-jwt-secret',
  HMAC_MASTER_SECRET: process.env.HMAC_MASTER_SECRET || 'replace-with-strong-secret',
  AUDIT_SIGNING_SECRET: process.env.AUDIT_SIGNING_SECRET || 'replace-audit-secret'
};
