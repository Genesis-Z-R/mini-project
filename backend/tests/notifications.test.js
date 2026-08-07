import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { NotificationService } from '../src/services/notification.service.js';

describe('Unified Notifications & Settings System Integration Tests', () => {
  const timestamp = Date.now();
  const userA = `usera_notif_${timestamp}@example.com`;
  const userB = `userb_notif_${timestamp}@example.com`;
  const userC = `userc_notif_${timestamp}@example.com`;

  beforeAll(async () => {
    await prisma.profile.createMany({
      data: [
        { id: userA, email: userA, name: 'Alice', pushNotificationsMaster: true },
        { id: userB, email: userB, name: 'Bob', pushNotificationsMaster: true },
        { id: userC, email: userC, name: 'Charlie', pushNotificationsMaster: true }
      ]
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: { in: [userA, userB, userC] } }
    });
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: { in: [userA, userB, userC] } },
          { receiverId: { in: [userA, userB, userC] } }
        ]
      }
    });
    await prisma.fileMetadata.deleteMany({
      where: { userId: { in: [userA, userB, userC] } }
    });
    await prisma.profile.deleteMany({
      where: { email: { in: [userA, userB, userC] } }
    });
  });

  describe('Social & Resource Anti-Spam Notifications', () => {
    test('1. Friend request received creates in-app notification', async () => {
      await request(app)
        .post('/api/friendships')
        .send({ senderId: userA, receiverId: userB });

      const notifsRes = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userB)}`);
      expect(notifsRes.status).toBe(200);

      const friendReqNotif = notifsRes.body.find(n => n.type === 'FRIEND_REQUEST_RECEIVED');
      expect(friendReqNotif).toBeDefined();
      expect(friendReqNotif.message).toContain('Alice');
      expect(friendReqNotif.link).toBe('peers');
    });

    test('2. Friend request accepted creates notification for sender', async () => {
      const friendships = await prisma.friendship.findMany({
        where: { senderId: userA, receiverId: userB }
      });
      expect(friendships.length).toBeGreaterThan(0);

      await request(app).put(`/api/friendships/${friendships[0].id}/accept?userId=${encodeURIComponent(userB)}`);

      const notifsRes = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userA)}`);
      expect(notifsRes.status).toBe(200);

      const acceptNotif = notifsRes.body.find(n => n.type === 'FRIEND_REQUEST_ACCEPTED');
      expect(acceptNotif).toBeDefined();
      expect(acceptNotif.message).toContain('Bob');
      expect(acceptNotif.link).toBe('peers');
    });

    test('3. Friend upload creates notification for friends, but NON-FRIENDS receive zero notifications', async () => {
      // Upload public file by UserA
      await request(app).post('/api/files').send({
        id: `f_notif_${timestamp}`,
        title: 'Algorithms Chapter Notes',
        fileType: 'pdf',
        size: '2.0 MB',
        isPublic: true,
        url: '/uploads/notif_test.pdf',
        userId: userA
      });

      // UserB is friend -> receives notification
      const userBNotifs = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userB)}`);
      const friendUploadNotif = userBNotifs.body.find(n => n.type === 'FRIEND_RESOURCE_UPLOAD' || n.type === 'FRIEND_COURSE_RESOURCE_UPLOAD');
      expect(friendUploadNotif).toBeDefined();

      // UserC is NOT friend -> receives ZERO resource upload notifications
      const userCNotifs = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userC)}`);
      const cNotif = userCNotifs.body.find(n => n.type === 'FRIEND_RESOURCE_UPLOAD' || n.type === 'FRIEND_COURSE_RESOURCE_UPLOAD');
      expect(cNotif).toBeUndefined();
    });
  });

  describe('Daily Digest & Event Reminders', () => {
    test('4. Daily Morning Summary is generated correctly', async () => {
      const digest = await NotificationService.generateDailyDigest(userA);
      expect(digest).toBeDefined();
      expect(digest.type).toBe('DAILY_DIGEST');
      expect(digest.link).toBe('schedule');
    });
  });

  describe('Notification Management & Read/Unread Status', () => {
    test('5. Marks notification as read and marks all as read', async () => {
      const notifsRes = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userB)}`);
      const unreadNotif = notifsRes.body.find(n => !n.isRead);
      expect(unreadNotif).toBeDefined();

      const markRes = await request(app).patch(`/api/notifications/${unreadNotif.id}/read`);
      expect(markRes.status).toBe(200);
      expect(markRes.body.isRead).toBe(true);

      const markAllRes = await request(app).patch(`/api/notifications/read-all?userId=${encodeURIComponent(userB)}`);
      expect(markAllRes.status).toBe(200);

      const notifsAfter = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userB)}`);
      const anyUnread = notifsAfter.body.some(n => !n.isRead);
      expect(anyUnread).toBe(false);
    });
  });

  describe('Settings Overrides & Privacy Controls', () => {
    test('6. Public Resource Directory OFF blocks public search discovery', async () => {
      // Turn publicResourceDirectoryEnabled OFF for UserA
      await request(app)
        .put(`/api/settings?userId=${encodeURIComponent(userA)}`)
        .send({ publicResourceDirectoryEnabled: false });

      // Search for UserA's file
      const searchRes = await request(app).get(`/api/files/search?query=Algorithms&userId=${encodeURIComponent(userB)}`);
      expect(searchRes.status).toBe(200);

      const userAFile = searchRes.body.find(f => f.userId === userA);
      expect(userAFile).toBeUndefined(); // Blocked by setting
    });

    test('7. Public Profile OFF hides user from peer discovery', async () => {
      // Turn publicProfileEnabled OFF for UserC
      await request(app)
        .put(`/api/settings?userId=${encodeURIComponent(userC)}`)
        .send({ publicProfileEnabled: false });

      const peerRes = await request(app).get(`/api/peers/recommended?userId=${encodeURIComponent(userA)}`);
      expect(peerRes.status).toBe(200);

      const userCPeer = peerRes.body.find(p => p.email === userC);
      expect(userCPeer).toBeUndefined(); // Hidden from peer discovery
    });

    test('8. Individual notification category toggle prevents creation when OFF', async () => {
      // Turn friendRequestReceivedEnabled OFF for UserC
      await request(app)
        .put(`/api/settings?userId=${encodeURIComponent(userC)}`)
        .send({ friendRequestReceivedEnabled: false });

      // Send friend request from UserB to UserC
      await request(app)
        .post('/api/friendships')
        .send({ senderId: userB, receiverId: userC });

      const cNotifs = await request(app).get(`/api/notifications?userId=${encodeURIComponent(userC)}`);
      const friendReqNotif = cNotifs.body.find(n => n.type === 'FRIEND_REQUEST_RECEIVED');
      expect(friendReqNotif).toBeUndefined(); // Opted out
    });
  });
});
