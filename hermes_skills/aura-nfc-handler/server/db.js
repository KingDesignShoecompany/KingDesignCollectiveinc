// db.js — self-contained postgres pool for nfc-handler (no cross-container requires).
const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://aura:replace-db-pass@db:5432/aura';
const pool = new Pool({ connectionString: DATABASE_URL });
module.exports = { query: (text, params) => pool.query(text, params), pool };
