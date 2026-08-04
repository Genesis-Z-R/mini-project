import { prisma } from '../config/db.js';

const TYPE_PREFERENCE_MAP = {
  CLASS_REMINDER: 'classRemindersEnabled',
  STUDY_SESSION_REMINDER: 'studySessionRemindersEnabled',
  EVENT_REMINDER: 'eventRemindersEnabled',
  DAILY_DIGEST: 'dailyDigestEnabled',
  FRIEND_REQUEST_RECEIVED: 'friendRequestReceivedEnabled',
  FRIEND_REQUEST_ACCEPTED: 'friendRequestAcceptedEnabled',
  FRIEND_RESOURCE_UPLOAD: 'friendResourceUploadEnabled',
  FRIEND_COURSE_RESOURCE_UPLOAD: 'friendCourseResourceUploadEnabled'
};

const DEFAULT_PRIORITY_MAP = {
  FRIEND_REQUEST_RECEIVED: 'HIGH',
  FRIEND_REQUEST_ACCEPTED: 'HIGH',
  CLASS_REMINDER: 'HIGH',
  STUDY_SESSION_REMINDER: 'HIGH',
  EVENT_REMINDER: 'HIGH',
  DAILY_DIGEST: 'MEDIUM',
  FRIEND_COURSE_RESOURCE_UPLOAD: 'MEDIUM',
  FRIEND_RESOURCE_UPLOAD: 'LOW'
};

export const NotificationService = {
  /**
   * Central entry point for creating in-app & push notifications
   */
  async createNotification({ userId, type, title, message, link, relatedId, priority }) {
    if (!userId || !type) return null;
    const emailKey = userId.trim().toLowerCase();

    // 1. Fetch recipient profile and notification settings
    const user = await prisma.profile.findUnique({
      where: { id: emailKey }
    });

    if (!user) return null;

    // Check individual category setting preference
    const prefKey = TYPE_PREFERENCE_MAP[type];
    if (prefKey && user[prefKey] === false) {
      return null;
    }

    // 2. Deduplication check: Do not send duplicate notifications for same relatedId & type today
    if (relatedId) {
      const todayString = new Date().toISOString().split('T')[0];
      const existing = await prisma.notification.findFirst({
        where: {
          userId: emailKey,
          type,
          relatedId,
          createdAt: {
            gte: new Date(`${todayString}T00:00:00.000Z`)
          }
        }
      });
      if (existing) return existing;
    }

    // 3. Save notification to database
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const assignedPriority = priority || DEFAULT_PRIORITY_MAP[type] || 'MEDIUM';

    const notification = await prisma.notification.create({
      data: {
        id,
        userId: emailKey,
        type,
        title,
        message,
        link: link || 'dashboard',
        relatedId: relatedId || null,
        priority: assignedPriority,
        isRead: false
      }
    });

    // 4. Browser Push delivery status check
    const pushDelivered = user.pushNotificationsMaster ?? true;

    return {
      ...notification,
      pushDelivered
    };
  },

  async getUserNotifications(userId) {
    const emailKey = userId.trim().toLowerCase();
    return await prisma.notification.findMany({
      where: { userId: emailKey },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  },

  async markAsRead(notificationId) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },

  async markAllAsRead(userId) {
    const emailKey = userId.trim().toLowerCase();
    return await prisma.notification.updateMany({
      where: { userId: emailKey, isRead: false },
      data: { isRead: true }
    });
  },

  async deleteNotification(notificationId) {
    return await prisma.notification.delete({
      where: { id: notificationId }
    });
  },

  /**
   * Daily Morning Summary Generator
   */
  async generateDailyDigest(userId) {
    const emailKey = userId.trim().toLowerCase();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if digest already sent today
    const existing = await prisma.notification.findFirst({
      where: {
        userId: emailKey,
        type: 'DAILY_DIGEST',
        createdAt: {
          gte: new Date(`${todayString}T00:00:00.000Z`)
        }
      }
    });

    if (existing) return existing;

    // Fetch user's schedule items for today
    const allSchedule = await prisma.schedule.findMany({
      where: { userId: emailKey }
    });

    const todaysItems = allSchedule
      .filter(item => item.isRepeating ? item.day === currentDayName : item.day === todayString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let title = "Good morning!";
    let message = "";

    if (todaysItems.length === 0) {
      message = "You have no scheduled classes or events for today. Have a productive study day!";
    } else {
      const firstTwo = todaysItems.slice(0, 2);
      const remainingCount = todaysItems.length - 2;

      const eventLines = firstTwo.map(item => `• ${item.name} (${item.startTime})`);
      message = `Today's schedule:\n${eventLines.join('\n')}`;
      if (remainingCount > 0) {
        message += `\n+${remainingCount} more event(s) today`;
      }
    }

    return await this.createNotification({
      userId: emailKey,
      type: 'DAILY_DIGEST',
      title,
      message,
      link: 'schedule',
      relatedId: `digest_${todayString}`,
      priority: 'MEDIUM'
    });
  },

  /**
   * Event Reminders Generator
   */
  async generateEventReminders(userId) {
    const emailKey = userId.trim().toLowerCase();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    const allSchedule = await prisma.schedule.findMany({
      where: { userId: emailKey }
    });

    const todaysItems = allSchedule.filter(item =>
      item.isRepeating ? item.day === currentDayName : item.day === todayString
    );

    const generated = [];

    for (const item of todaysItems) {
      const [h, m] = item.startTime.split(':').map(Number);
      const itemMinutes = h * 60 + m;
      const diff = itemMinutes - currentMinutes;

      // Notify if starting in 0-30 minutes
      if (diff >= 0 && diff <= 30) {
        const notifType = item.scheduleType === 'CLASS' ? 'CLASS_REMINDER' :
                          item.scheduleType === 'STUDY_SESSION' ? 'STUDY_SESSION_REMINDER' : 'EVENT_REMINDER';
        
        const notif = await this.createNotification({
          userId: emailKey,
          type: notifType,
          title: item.scheduleType === 'CLASS' ? 'Class Starting Soon' : 'Upcoming Event',
          message: `Your ${item.name} starts in ${diff} minute(s) (${item.startTime}).`,
          link: 'schedule',
          relatedId: `event_${item.id}_${todayString}`,
          priority: 'HIGH'
        });
        if (notif) generated.push(notif);
      }
    }

    return generated;
  },

  /**
   * Notify friends on resource upload (Strict Anti-Spam)
   */
  async notifyFriendsOfResourceUpload(uploaderUserId, fileMetadata) {
    const uploaderKey = uploaderUserId.trim().toLowerCase();
    const uploader = await prisma.profile.findUnique({ where: { id: uploaderKey } });
    const uploaderName = uploader?.name || uploaderKey.split('@')[0];

    // Find accepted friends only
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: uploaderKey },
          { receiverId: uploaderKey }
        ]
      }
    });

    const friendEmails = friendships.map(f =>
      f.senderId === uploaderKey ? f.receiverId : f.senderId
    );

    for (const friendEmail of friendEmails) {
      const friendProfile = await prisma.profile.findUnique({
        where: { id: friendEmail },
        include: { courses: true }
      });

      if (!friendProfile) continue;

      const isCourseMatch = fileMetadata.courseId &&
        fileMetadata.courseId !== 'none' &&
        friendProfile.courses.some(c => c.code.toLowerCase() === fileMetadata.courseId.toLowerCase() || c.id === fileMetadata.courseId);

      const type = isCourseMatch ? 'FRIEND_COURSE_RESOURCE_UPLOAD' : 'FRIEND_RESOURCE_UPLOAD';
      const title = isCourseMatch ? 'New Course Resource Shared' : 'Friend Uploaded Resource';
      const message = isCourseMatch
        ? `${uploaderName} uploaded "${fileMetadata.title}" for your course!`
        : `${uploaderName} uploaded "${fileMetadata.title}".`;

      await this.createNotification({
        userId: friendEmail,
        type,
        title,
        message,
        link: 'global_search',
        relatedId: `file_${fileMetadata.id}`,
        priority: isCourseMatch ? 'MEDIUM' : 'LOW'
      });
    }
  }
};
