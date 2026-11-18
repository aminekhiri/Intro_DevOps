'use strict';

const pino = require('pino');

// JSON structure sur stdout, niveaux info/warn/error
module.exports = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'tp4-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
});
