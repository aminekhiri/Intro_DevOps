'use strict';

const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// RED : Rate + Errors (label status) et Duration
const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre de requetes HTTP',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duree des requetes HTTP',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : 'unknown',
      status: res.statusCode,
    };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
}

module.exports = { register, metricsMiddleware };
