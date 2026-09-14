// app.js
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./utils/logger');

const issueNonceRoute = require('./routes/issueNonce');
const verifyActionRoute = require('./routes/verifyAction');
const verifyCardForTournamentRoute = require('./routes/verifyCardForTournament');

const app = express();
app.use(bodyParser.json());

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/issueNonce', issueNonceRoute);
app.use('/verifyAction', verifyActionRoute);
app.use('/verifyCardForTournament', verifyCardForTournamentRoute);

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(config.PORT, () => {
  logger.info(`Anti-cheat service listening on port ${config.PORT}`);
});

module.exports = app;
