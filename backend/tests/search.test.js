import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Intelligent Global Academic Resource Search Integration Tests', () => {
  const timestamp = Date.now();
  const userA = `usera_search_${timestamp}@example.com`;
  const userB = `userb_search_${timestamp}@example.com`;
  const userC = `userc_search_${timestamp}@example.com`;

  let csProgId;
  let eeProgId;

  beforeAll(async () => {
    // 1. Create Programmes
    const progCS = await request(app).post('/api/programmes').send({ name: 'Computer Science' });
    const progEE = await request(app).post('/api/programmes').send({ name: 'Electrical Engineering' });
    csProgId = progCS.body.id;
    eeProgId = progEE.body.id;

    // 2. Create Profiles
    await prisma.profile.createMany({
      data: [
        { id: userA, email: userA, name: 'Student Alice (CS)', year: 'Year 3', programmeId: csProgId, programmeName: 'Computer Science' },
        { id: userB, email: userB, name: 'Student Bob (CS)', year: 'Year 3', programmeId: csProgId, programmeName: 'Computer Science' },
        { id: userC, email: userC, name: 'Student Charlie (EE)', year: 'Year 1', programmeId: eeProgId, programmeName: 'Electrical Engineering' }
      ]
    });

    // 3. Upload Public Test Files
    await request(app).post('/api/files').send({
      id: `f_exact_${timestamp}`,
      title: 'Database Systems Master Guide',
      fileType: 'pdf',
      size: '2.5 MB',
      isPublic: true,
      url: '/uploads/test_exact.pdf',
      userId: userB // CS Student (Same programme as Alice)
    });

    await request(app).post('/api/files').send({
      id: `f_other_${timestamp}`,
      title: 'Database Systems Master Guide',
      fileType: 'pdf',
      size: '1.8 MB',
      isPublic: true,
      url: '/uploads/test_other.pdf',
      userId: userC // EE Student (Different programme)
    });

    await request(app).post('/api/files').send({
      id: `f_partial_${timestamp}`,
      title: 'Advanced Database Lab Manual',
      fileType: 'docx',
      size: '1.2 MB',
      isPublic: true,
      url: '/uploads/test_partial.docx',
      userId: userB // CS Student
    });
  });

  afterAll(async () => {
    await prisma.fileMetadata.deleteMany({
      where: { id: { in: [`f_exact_${timestamp}`, `f_other_${timestamp}`, `f_partial_${timestamp}`] } }
    });
    await prisma.profile.deleteMany({
      where: { email: { in: [userA, userB, userC] } }
    });
  });

  test('1. Exact title match receives highest relevance score (+100)', async () => {
    const res = await request(app).get(`/api/files/search?query=Database%20Systems%20Master%20Guide&userId=${encodeURIComponent(userA)}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);

    const firstResult = res.body[0];
    expect(firstResult.title).toBe('Database Systems Master Guide');
    expect(firstResult.matchReasons).toContain('Exact Title Match (+100)');
  });

  test('2. Prioritizes resources uploaded by same programme students (+30 points)', async () => {
    const res = await request(app).get(`/api/files/search?query=Database%20Systems%20Master%20Guide&userId=${encodeURIComponent(userA)}`);
    expect(res.status).toBe(200);

    const csUpload = res.body.find(f => f.userId === userB);
    const eeUpload = res.body.find(f => f.userId === userC);

    expect(csUpload).toBeDefined();
    expect(eeUpload).toBeDefined();
    expect(csUpload.relevanceScore).toBeGreaterThan(eeUpload.relevanceScore);
  });

  test('3. Global search still retains resources from other programmes', async () => {
    const res = await request(app).get(`/api/files/search?query=Database%20Systems%20Master%20Guide&userId=${encodeURIComponent(userA)}`);
    expect(res.status).toBe(200);

    const eeUpload = res.body.find(f => f.userId === userC);
    expect(eeUpload).toBeDefined(); // Retained globally
  });

  test('4. Partial keyword search matches title and scores correctly', async () => {
    const res = await request(app).get(`/api/files/search?query=Database&userId=${encodeURIComponent(userA)}`);
    expect(res.status).toBe(200);

    const partialFile = res.body.find(f => f.id === `f_partial_${timestamp}`);
    expect(partialFile).toBeDefined();
    expect(partialFile.matchReasons).toContain('Keyword Match (+50)');
  });

  test('5. Same programme filter restricts search results when enabled', async () => {
    const res = await request(app).get(`/api/files/search?query=Database&userId=${encodeURIComponent(userA)}&programmeOnly=true`);
    expect(res.status).toBe(200);

    const eeUpload = res.body.find(f => f.userId === userC);
    expect(eeUpload).toBeUndefined();

    const csUpload = res.body.find(f => f.userId === userB);
    expect(csUpload).toBeDefined();
  });

  test('6. File type filter restricts results by specified extension', async () => {
    const res = await request(app).get(`/api/files/search?query=Database&userId=${encodeURIComponent(userA)}&fileType=docx`);
    expect(res.status).toBe(200);

    const docxOnly = res.body.every(f => f.fileType === 'docx');
    expect(docxOnly).toBe(true);
  });
});
