'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('TP4 API', () => {
  test('GET /health -> 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/data renvoie le message et un trace_id', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.headers['x-trace-id']).toBeDefined();
  });

  test('GET /metrics expose le format Prometheus', async () => {
    await request(app).get('/api/data');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
