import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { normalizeProgrammeName } from '../src/utils/programme.utils.js';

describe('Programme & Student Peer Networking Integration Tests', () => {
  const timestamp = Date.now();
  const testUserA = `usera_peers_${timestamp}@example.com`;
  const testUserB = `userb_peers_${timestamp}@example.com`;
  const testUserC = `userc_peers_${timestamp}@example.com`;

  beforeAll(async () => {
    // Seed profiles
    await prisma.profile.createMany({
      data: [
        { id: testUserA, email: testUserA, name: 'Alice CS Year3', year: 'Year 3' },
        { id: testUserB, email: testUserB, name: 'Bob CS Year3', year: 'Year 3' },
        { id: testUserC, email: testUserC, name: 'Charlie EE Year1', year: 'Year 1' },
      ]
    });
  });

  afterAll(async () => {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: { in: [testUserA, testUserB, testUserC] } },
          { receiverId: { in: [testUserA, testUserB, testUserC] } }
        ]
      }
    });
    await prisma.profile.deleteMany({
      where: { email: { in: [testUserA, testUserB, testUserC] } }
    });
  });

  describe('Programme Normalization & Database Management', () => {
    test('1. Normalizes various degree name formats correctly', () => {
      expect(normalizeProgrammeName('BSc Computer Science')).toBe('computer science');
      expect(normalizeProgrammeName('B.Sc. Computer Science')).toBe('computer science');
      expect(normalizeProgrammeName('COMPUTER SCIENCE')).toBe('computer science');
      expect(normalizeProgrammeName('  Bachelor of Science in Electrical Engineering  ')).toBe('electrical engineering');
    });

    test('2. GET /api/programmes returns seeded standard programmes', async () => {
      const res = await request(app).get('/api/programmes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('3. POST /api/programmes creates or reuses normalized programme', async () => {
      const res1 = await request(app)
        .post('/api/programmes')
        .send({ name: 'BSc Software Engineering' });
      expect(res1.status).toBe(200);
      expect(res1.body.normalizedName).toBe('software engineering');

      const res2 = await request(app)
        .post('/api/programmes')
        .send({ name: 'SOFTWARE ENGINEERING' });
      expect(res2.status).toBe(200);
      expect(res2.body.id).toBe(res1.body.id);
    });
  });

  describe('Profile Programme Assignment & Updates', () => {
    test('4. Assigns programme to profile successfully', async () => {
      const progRes = await request(app)
        .post('/api/programmes')
        .send({ name: 'Computer Science' });
      const progId = progRes.body.id;

      const updateRes = await request(app)
        .put(`/api/profiles/${encodeURIComponent(testUserA)}`)
        .send({
          name: 'Alice CS Year3',
          year: 'Year 3',
          programmeId: progId,
          programmeName: 'Computer Science'
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.programmeId).toBe(progId);
      expect(updateRes.body.programmeName).toBe('Computer Science');
    });
  });

  describe('Peer Recommendation & Academic Similarity Ranking Engine', () => {
    test('5. Ranks peers by same programme and academic year, excluding self', async () => {
      const progRes = await request(app)
        .post('/api/programmes')
        .send({ name: 'Computer Science' });
      const csProgId = progRes.body.id;

      // Set Bob to Computer Science Year 3 with shared course
      await prisma.course.upsert({
        where: { id: `c_cs352_${timestamp}_a` },
        update: {},
        create: { id: `c_cs352_${timestamp}_a`, code: 'CSM 352', name: 'Software Dev', userId: testUserA }
      });
      await prisma.course.upsert({
        where: { id: `c_cs352_${timestamp}_b` },
        update: {},
        create: { id: `c_cs352_${timestamp}_b`, code: 'CSM 352', name: 'Software Dev', userId: testUserB }
      });

      await request(app)
        .put(`/api/profiles/${encodeURIComponent(testUserB)}`)
        .send({
          name: 'Bob CS Year3',
          year: 'Year 3',
          programmeId: csProgId,
          programmeName: 'Computer Science'
        });

      const recRes = await request(app).get(`/api/peers/recommended?userId=${encodeURIComponent(testUserA)}`);
      expect(recRes.status).toBe(200);
      expect(Array.isArray(recRes.body)).toBe(true);

      // Exclude self check
      const selfInRecs = recRes.body.find(p => p.email === testUserA);
      expect(selfInRecs).toBeUndefined();

      // Bob should be top recommended peer (Score 160: 100 for Programme + 50 for Year 3 + 10 for Shared Course)
      const topPeer = recRes.body[0];
      expect(topPeer.email).toBe(testUserB);
      expect(topPeer.matchScore).toBe(160);
      expect(topPeer.matchReasons).toContain('Same Programme: Computer Science');
      expect(topPeer.matchReasons).toContain('Same Year: Year 3');
    });
  });

  describe('Following System & Friendship Integration', () => {
    test('6. Follows peer and updates follow status', async () => {
      // Send friend/follow request from UserA to UserB
      const followRes = await request(app)
        .post('/api/friendships')
        .send({
          senderId: testUserA,
          receiverId: testUserB
        });
      expect(followRes.status).toBe(200);

      // Verify recommendation endpoint reflects status
      const recRes = await request(app).get(`/api/peers/recommended?userId=${encodeURIComponent(testUserA)}`);
      const bobPeer = recRes.body.find(p => p.email === testUserB);
      expect(bobPeer).toBeDefined();
      expect(bobPeer.followStatus).toBe('sent');
    });
  });
});
