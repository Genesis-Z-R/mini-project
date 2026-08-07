import { prisma } from '../config/db.js';

export const StudySessionService = {
  async getSessionsByUser(userId, page, limit) {
    const emailKey = userId.trim().toLowerCase();
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const [items, total] = await Promise.all([
        prisma.studySession.findMany({
          where: { userId: emailKey },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.studySession.count({ where: { userId: emailKey } })
      ]);
      return { items, total };
    }
    return await prisma.studySession.findMany({
      where: { userId: emailKey }
    });
  },

  async createSession(sessionData) {
    const userId = sessionData.userId.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: { id: userId, email: userId, name: userId.split('@')[0] }
      });
    }

    const id = sessionData.id || `ss_${Date.now()}`;
    return await prisma.studySession.upsert({
      where: { id },
      update: {
        durationMinutes: sessionData.durationMinutes,
        date: sessionData.date || new Date().toISOString().split('T')[0],
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        userId
      },
      create: {
        id,
        durationMinutes: sessionData.durationMinutes,
        date: sessionData.date || new Date().toISOString().split('T')[0],
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        userId
      }
    });
  }
};
