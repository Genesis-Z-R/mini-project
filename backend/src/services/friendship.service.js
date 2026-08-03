import { prisma } from '../config/db.js';

export const FriendshipService = {
  async getFriendshipsByUser(userId) {
    const emailKey = userId.trim().toLowerCase();
    return await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: emailKey },
          { receiverId: emailKey }
        ]
      }
    });
  },

  async sendRequest(data) {
    const senderId = data.senderId.trim().toLowerCase();
    const receiverId = data.receiverId.trim().toLowerCase();

    // Ensure profiles exist for both sender and receiver
    await Promise.all([
      prisma.profile.upsert({
        where: { id: senderId },
        update: {},
        create: { id: senderId, email: senderId, name: senderId.split('@')[0] }
      }),
      prisma.profile.upsert({
        where: { id: receiverId },
        update: {},
        create: { id: receiverId, email: receiverId, name: receiverId.split('@')[0] }
      })
    ]);

    const id = data.id || `fr_${Date.now()}`;
    return await prisma.friendship.upsert({
      where: { id },
      update: {
        senderId,
        receiverId,
        status: data.status || 'pending'
      },
      create: {
        id,
        senderId,
        receiverId,
        status: data.status || 'pending'
      }
    });
  },

  async acceptRequest(id) {
    return await prisma.friendship.update({
      where: { id },
      data: { status: 'accepted' }
    });
  },

  async removeFriendship(id) {
    await prisma.friendship.delete({
      where: { id }
    });
  }
};
