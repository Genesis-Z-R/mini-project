import request from 'supertest';
import app from '../src/app.js';

describe('Auth Endpoints', () => {
  const testEmail = `test_${Date.now()}@gmail.com`;
  const testPassword = 'password123';

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testEmail);
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should handle logout', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toEqual(204);
  });
});
