'use strict';

const crypto = require('node:crypto');
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const { register, metricsMiddleware } = require('./metrics');

const app = express();
const VERSION = process.env.APP_VERSION || 'dev';

// un trace_id par requete (repris du header x-trace-id s'il existe)
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-trace-id'] || crypto.randomUUID();
      res.setHeader('x-trace-id', id);
      return id;
    },
    customProps: (req) => ({ trace_id: req.id }),
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: { ignore: (req) => req.url === '/metrics' || req.url === '/health' },
  }),
);
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/api/data', (req, res) => {
  res.json({
    status: 'success',
    message: 'Bonjour depuis TP4',
    version: VERSION,
    env: process.env.APP_ENV || 'local',
  });
});

module.exports = app;
