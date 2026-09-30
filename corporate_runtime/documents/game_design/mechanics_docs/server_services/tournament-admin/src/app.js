// app.js
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

const tournamentRoutes = require('./routes/tournamentRoutes');
const judgeTools = require('./routes/judgeTools');
const exportLogs = require('./routes/exportLogs');
const verifyCardRoute = require('./routes/verifyCardForTournament');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/tournament', tournamentRoutes);
app.use('/judge', judgeTools);
app.use('/tournament/exportLogs', exportLogs);
app.use('/tournament/verifyCard', verifyCardRoute);

app.listen(config.PORT, () => {
  console.log(`Tournament admin service listening on port ${config.PORT}`);
});

module.exports = app;
