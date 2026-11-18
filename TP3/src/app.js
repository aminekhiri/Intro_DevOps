'use strict';

const express = require('express');

const app = express();
const VERSION = process.env.APP_VERSION || 'dev';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/data', (req, res) => {
  res.json({
    status: 'success',
    message: 'Bonjour depuis TP3',
    version: VERSION,
    env: process.env.APP_ENV || 'local',
  });
});

module.exports = app;
