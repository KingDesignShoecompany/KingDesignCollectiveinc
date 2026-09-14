// app.js
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

const registerCardRoute = require('./routes/registerCard');
const battleSyncRoute = require('./routes/battleSync');
const writeTokenRoute = require('./routes/writeToken');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/registerCard', registerCardRoute);
app.use('/battleSync', battleSyncRoute);
app.use('/writeToken', writeTokenRoute);

app.listen(config.PORT, () => {
  console.log(`Aura Champions backend listening on port ${config.PORT}`);
});

module.exports = app;
