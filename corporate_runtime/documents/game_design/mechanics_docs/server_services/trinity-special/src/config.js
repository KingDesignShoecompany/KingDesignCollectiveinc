// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  TRINITY_ALLOWED: process.env.TRINITY_ALLOWED !== 'false',
  EVENT_EMITTER_ENABLED: process.env.EVENT_EMITTER_ENABLED === 'true'
};
