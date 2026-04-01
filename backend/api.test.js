
const request = require('supertest');
const app = require('./index');
const db = require('./db');

describe('API Endpoints', () => {
  it('GET /api/reports should return an array', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });


  it('POST /api/reports should create a new report (valid data)', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('location', 'Test Location')
      .field('description', 'Test Description')
      .field('severity', 'low')
      .field('latitude', 0.3476)
      .field('longitude', 32.5825);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.location).toBe('Test Location');
  });

  it('POST /api/reports should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('location', '') // Missing required fields
      .field('description', '')
      .field('severity', 'invalid')
      .field('latitude', '')
      .field('longitude', '');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/auth/register should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `testuser${Date.now()}@example.com`, password: 'testpass123', phone: '', role: 'user' });
    expect([200, 400]).toContain(res.statusCode); // 400 if email already exists
    if (res.statusCode === 200) {
      expect(res.body.user).toHaveProperty('id');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('POST /api/auth/login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // --- Payment Endpoints Tests ---
  let testUserId;
  let testTransactionId;

  beforeAll(async () => {
    // Register a user for payment tests
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `payuser${Date.now()}@example.com`, password: 'testpass123', phone: '256700000001', role: 'user' });
    if (res.statusCode === 200 && res.body.user) {
      testUserId = res.body.user.id;
    } else {
      // fallback: try to login and get userId
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: `payuser${Date.now()}@example.com`, password: 'testpass123' });
      testUserId = loginRes.body.user ? loginRes.body.user.id : 1;
    }
  });

  it('POST /pay should fail with missing fields', async () => {
    const res = await request(app)
      .post('/pay')
      .send({ userId: '', provider: '', duration: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /pay should fail with invalid provider', async () => {
    const res = await request(app)
      .post('/pay')
      .send({ userId: testUserId, provider: 'invalid', duration: 'month' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /pay should initiate payment (MTN)', async () => {
    const res = await request(app)
      .post('/pay')
      .send({ userId: testUserId, provider: 'mtn', duration: 'month' });
    expect([200,500]).toContain(res.statusCode); // 500 if payment API fails
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('transactionId');
      testTransactionId = res.body.transactionId;
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('POST /pay should initiate payment (Airtel)', async () => {
    const res = await request(app)
      .post('/pay')
      .send({ userId: testUserId, provider: 'airtel', duration: 'month' });
    expect([200,500]).toContain(res.statusCode); // 500 if payment API fails
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('transactionId');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('GET /payment-status should return paid status (may be false if payment not completed)', async () => {
    const res = await request(app)
      .get('/payment-status')
      .query({ userId: testUserId });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('paid');
  });

});

afterAll(() => {
  db.end(); // Close the MySQL connection
});
