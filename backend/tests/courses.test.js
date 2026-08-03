import request from 'supertest';
import app from '../src/app.js';

describe('Course & Ownership Endpoints', () => {
  const userA = `usera_${Date.now()}@gmail.com`;
  const userB = `userb_${Date.now()}@gmail.com`;
  const courseId = `c_test_${Date.now()}`;

  it('should create a course for User A', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({
        id: courseId,
        name: 'Computer Science 101',
        code: 'CS101',
        room: 'Lab 3A',
        userId: userA
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', courseId);
  });

  it('should fetch courses for User A', async () => {
    const res = await request(app)
      .get(`/api/courses?userId=${encodeURIComponent(userA)}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should reject course deletion by unauthorized User B (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId}?userId=${encodeURIComponent(userB)}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should allow course deletion by owner User A', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId}?userId=${encodeURIComponent(userA)}`);

    expect(res.statusCode).toEqual(204);
  });
});
