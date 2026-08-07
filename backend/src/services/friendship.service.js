import { prisma } from '../config/db.js';
import { NotificationService } from './notification.service.js';

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

    // Prevent self-following / self-request
    if (senderId === receiverId) {
      throw new Error("Cannot send friend request to yourself.");
    }

    // Ensure profiles exist for both sender and receiver
    const [senderProfile] = await Promise.all([
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

    const existingRelation = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingRelation) {
      return existingRelation;
    }

    const id = data.id || `fr_${Date.now()}`;
    const friendship = await prisma.friendship.create({
      data: {
        id,
        senderId,
        receiverId,
        status: data.status || 'pending'
      }
    });

    // Centralized Notification Trigger: Friend Request Received
    const senderName = senderProfile?.name || senderId.split('@')[0];
    await NotificationService.createNotification({
      userId: receiverId,
      type: 'FRIEND_REQUEST_RECEIVED',
      title: 'New Friend Request',
      message: `${senderName} sent you a friend request.`,
      link: 'peers'
    });

    return friendship;
  },

  async acceptRequest(id) {
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: 'accepted' }
    });

    if (updated) {
      const receiverProfile = await prisma.profile.findUnique({ where: { id: updated.receiverId } });
      const accepterName = receiverProfile?.name || updated.receiverId.split('@')[0];

      // Centralized Notification Trigger: Friend Request Accepted
      await NotificationService.createNotification({
        userId: updated.senderId,
        type: 'FRIEND_REQUEST_ACCEPTED',
        title: 'Friend Request Accepted',
        message: `${accepterName} accepted your friend request!`,
        link: 'peers'
      });
    }

    return updated;
  },

  async removeFriendship(id) {
    await prisma.friendship.delete({
      where: { id }
    });
  }
};
