import request from 'supertest';
import path from 'path';
import app from '../src/app.js';

describe('Course & File Upload Module Automated Tests', () => {
  const timestamp = Date.now();
  const userA = `usera_${timestamp}@gmail.com`;
  const userB = `userb_${timestamp}@gmail.com`;
  const courseId1 = `c_test_1_${timestamp}`;
  const courseId2 = `c_test_2_${timestamp}`;

  it('1. Should create a course for User A', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({
        id: courseId1,
        name: 'Computer Architecture',
        code: 'CSM 352',
        room: 'Lab 3A',
        userId: userA
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', courseId1);
  });

  it('2. Should reject duplicate course creation by normalized code ("CSM352" vs "CSM 352")', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({
        name: 'Advanced Architecture',
        code: 'csm352', // Normalized matches 'CSM 352'
        room: 'Lab 4B',
        userId: userA
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toContain('A course with this code already exists.');
  });

  it('3. Should reject duplicate course creation by normalized name ("computer architecture")', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({
        name: 'computer architecture', // Normalized matches 'Computer Architecture'
        code: 'CSM 999',
        room: 'Lab 4B',
        userId: userA
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toContain('A course with this name already exists.');
  });

  it('4. Should allow course creation with duplicate room (room is not unique)', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({
        id: courseId2,
        name: 'Database Systems',
        code: 'CSM 204',
        room: 'Lab 3A', // Same room as Course 1
        userId: userA
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', courseId2);
  });

  it('5. Should update an existing course via PUT endpoint', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId1}?userId=${encodeURIComponent(userA)}`)
      .send({
        name: 'Computer Architecture II',
        code: 'CSM 352',
        room: 'Room 201',
        userId: userA
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'Computer Architecture II');
    expect(res.body).toHaveProperty('room', 'Room 201');
  });

  it('6. Should reject course update if updated code conflicts with another course', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId2}?userId=${encodeURIComponent(userA)}`)
      .send({
        name: 'Database Systems',
        code: 'CSM 352', // Conflicts with Course 1
        room: 'Room 201',
        userId: userA
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toContain('A course with this code already exists.');
  });

  it('7. File Upload: Should accept valid academic file upload (.pdf)', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .attach('file', Buffer.from('%PDF-1.4 sample content'), 'test_document.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('publicUrl');
    expect(res.body.publicUrl).toContain('.pdf');
  });

  it('8. File Upload: Should reject invalid non-academic file upload (.exe, .zip)', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .attach('file', Buffer.from('binary executable content'), 'malicious_program.exe');

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Unsupported file type.');
  });

  it('9. Should reject course deletion by unauthorized User B (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId1}?userId=${encodeURIComponent(userB)}`);

    expect(res.statusCode).toEqual(403);
  });

  it('10. Should allow course deletion by owner User A', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId1}?userId=${encodeURIComponent(userA)}`);

    expect(res.statusCode).toEqual(204);
  });
});
