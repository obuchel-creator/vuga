const request = require('supertest');

// Mock the pg pool so tests don't need a real database
jest.mock('./db', () => {
  return {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  };
});

const { app } = require('./index');

describe('API Endpoints', () => {
  it('GET /api/reports should return an array', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/reports should require auth', async () => {
    const res = await request(app).post('/api/reports').send({
      location: 'Test', description: 'Test', severity: 'low', latitude: 0, longitude: 0
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/reports/:id/upvote should require auth', async () => {
    const res = await request(app).post('/api/reports/1/upvote');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/reports/:id/downvote should require auth', async () => {
    const res = await request(app).post('/api/reports/1/downvote');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/reports/:id/comments should require auth', async () => {
    const res = await request(app).post('/api/reports/1/comments').send({ text: 'hi' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/push/register should require auth', async () => {
    const res = await request(app).post('/api/push/register').send({ expoPushToken: 'tok' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/push/send should require auth', async () => {
    const res = await request(app).post('/api/push/send').send({ message: 'hi' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/admin/broadcast should require auth', async () => {
    const res = await request(app).post('/api/admin/broadcast').send({ message: 'hi' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/register should fail with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login should fail with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/route-suggestions should fail with bad input', async () => {
    const res = await request(app).post('/api/route-suggestions').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/route-suggestions should succeed with valid coords', async () => {
    const res = await request(app).post('/api/route-suggestions').send({
      start: { latitude: 0.3, longitude: 32.5 },
      end: { latitude: 0.4, longitude: 32.6 }
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.route).toBeDefined();
  });
});

