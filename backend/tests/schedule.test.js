import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Schedule System Integration Tests', () => {
  const testUserId = `user_sched_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create test user profile
    await prisma.profile.create({
      data: {
        id: testUserId,
        email: testUserId,
        name: 'Schedule Test User'
      }
    });
  });

  afterAll(async () => {
    await prisma.schedule.deleteMany({ where: { userId: testUserId } });
    await prisma.profile.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  let classItemId = `s_class_${Date.now()}`;
  let studyItemId = `s_study_${Date.now()}`;
  let customItemId = `s_custom_${Date.now()}`;

  test('1. Create a class schedule item (CLASS)', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .send({
        id: classItemId,
        name: 'Database Systems Lecture',
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        room: 'Lab 3B',
        scheduleType: 'CLASS',
        isRepeating: true,
        userId: testUserId
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Database Systems Lecture');
    expect(res.body.scheduleType).toBe('CLASS');
    expect(res.body.isClass).toBe(true);
  });

  test('2. Create a study session schedule item (STUDY_SESSION)', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .send({
        id: studyItemId,
        name: 'Algorithm Revision',
        day: 'Monday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'Library',
        scheduleType: 'STUDY_SESSION',
        isRepeating: false,
        userId: testUserId
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Algorithm Revision');
    expect(res.body.scheduleType).toBe('STUDY_SESSION');
    expect(res.body.isClass).toBe(false);
  });

  test('3. Create a custom category schedule item (CUSTOM)', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .send({
        id: customItemId,
        name: 'Hardware Design Project',
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
        room: 'Robotics Lab',
        scheduleType: 'CUSTOM',
        customCategory: 'Robotics Team',
        isRepeating: true,
        userId: testUserId
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Hardware Design Project');
    expect(res.body.scheduleType).toBe('CUSTOM');
    expect(res.body.customCategory).toBe('Robotics Team');
  });

  test('4. Fetch schedule for user', async () => {
    const res = await request(app)
      .get(`/api/schedule?userId=${encodeURIComponent(testUserId)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test('5. Edit a schedule event', async () => {
    const res = await request(app)
      .put(`/api/schedule/${classItemId}`)
      .send({
        name: 'Advanced Database Systems Lecture',
        room: 'Main Auditorium',
        userId: testUserId
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Advanced Database Systems Lecture');
    expect(res.body.room).toBe('Main Auditorium');
  });

  test('6. Delete a schedule event', async () => {
    const res = await request(app)
      .delete(`/api/schedule/${customItemId}?userId=${encodeURIComponent(testUserId)}`);

    expect(res.status).toBe(204);

    const checkRes = await request(app)
      .get(`/api/schedule?userId=${encodeURIComponent(testUserId)}`);

    const deletedItem = checkRes.body.find(i => i.id === customItemId);
    expect(deletedItem).toBeUndefined();
  });
});
