import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Authentication Module & Requirements Verification', () => {
  const timestamp = Date.now();
  const validEmail = `auth_test_${timestamp}@gmail.com`;
  const validPassword = 'securePassword123';
  const unknownEmail = `nonexistent_${timestamp}@gmail.com`;

  it('1. Successful Registration - returns JWT token and user info', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validEmail, password: validPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', validEmail);
    expect(res.body.user).toHaveProperty('id', validEmail);
  });

  it('2. Duplicate Registration - rejects existing email with HTTP 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validEmail, password: validPassword });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty('message', 'An account with this email already exists.');
  });

  it('3. Invalid Email Format - rejects with HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: validPassword });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  it('4. Weak Password (< 6 chars) - rejects with HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `weak_${timestamp}@gmail.com`, password: '123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Password must be at least 6 characters');
  });

  it('5. Successful Login - authenticates registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validEmail, password: validPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', validEmail);
  });

  it('6. Wrong Password - returns HTTP 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validEmail, password: 'WrongPassword123' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('7. Unknown Email Login - returns HTTP 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: unknownEmail, password: validPassword });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('8. Login NEVER creates new users in database', async () => {
    const freshEmail = `never_create_${timestamp}@gmail.com`;

    // Attempt login with non-existent email
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: freshEmail, password: validPassword });

    expect(loginRes.statusCode).toEqual(401);

    // Verify database record was NOT created
    const dbProfile = await prisma.profile.findUnique({
      where: { email: freshEmail }
    });

    expect(dbProfile).toBeNull();
  });
});
