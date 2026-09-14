// app.js
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

const trinityRoutes = require('./routes/trinityRoutes');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/trinity', trinityRoutes);

app.listen(config.PORT, () => {
  console.log(`Trinity service listening on port ${config.PORT}`);
});

module.exports = app;
