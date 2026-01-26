const request = require('supertest');
const app = require('./index');

describe('API Endpoints', () => {
  it('GET /api/reports should return an array', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Add more tests as needed, e.g., POST /api/reports, error cases, etc.
});
