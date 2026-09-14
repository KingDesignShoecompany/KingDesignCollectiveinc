// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3003,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://aura:replace-db-pass@localhost:5432/aura',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-jwt-secret'
};
