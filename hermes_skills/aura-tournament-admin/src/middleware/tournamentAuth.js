// tournamentAuth.js
const config = require('../config');

function requireJudge(req, res, next) {
  // Simplified: expect Authorization header with judge token
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing judge auth' });
  req.judge = { id: auth.split(' ')[1] };
  next();
}

module.exports = { requireJudge };
