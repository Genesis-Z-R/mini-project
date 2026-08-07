import { prisma } from '../config/db.js';

export const ScheduleService = {
  async getScheduleByUser(userId) {
    return await prisma.schedule.findMany({
      where: { userId: userId.trim().toLowerCase() }
    });
  },

  async createSchedule(item) {
    const userId = item.userId.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: { id: userId, email: userId, name: userId.split('@')[0] }
      });
    }

    const id = item.id || `s_${Date.now()}`;
    const scheduleType = item.scheduleType || (item.isClass ? 'CLASS' : 'PERSONAL_EVENT');
    const isClass = scheduleType === 'CLASS';

    return await prisma.schedule.upsert({
      where: { id },
      update: {
        courseId: item.courseId,
        name: item.name,
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        isRepeating: item.isRepeating ?? true,
        repeatFrequency: item.repeatFrequency || 'weekly',
        isClass,
        scheduleType,
        customCategory: item.customCategory || null,
        userId
      },
      create: {
        id,
        courseId: item.courseId,
        name: item.name,
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        isRepeating: item.isRepeating ?? true,
        repeatFrequency: item.repeatFrequency || 'weekly',
        isClass,
        scheduleType,
        customCategory: item.customCategory || null,
        userId
      }
    });
  },

  async updateSchedule(id, item) {
    const userId = item.userId ? item.userId.trim().toLowerCase() : undefined;
    const scheduleType = item.scheduleType !== undefined
      ? item.scheduleType
      : item.isClass !== undefined
        ? (item.isClass ? 'CLASS' : 'PERSONAL_EVENT')
        : undefined;

    const isClass = scheduleType !== undefined ? (scheduleType === 'CLASS') : item.isClass;

    return await prisma.schedule.update({
      where: { id },
      data: {
        ...(item.courseId !== undefined && { courseId: item.courseId }),
        ...(item.name !== undefined && { name: item.name }),
        ...(item.day !== undefined && { day: item.day }),
        ...(item.startTime !== undefined && { startTime: item.startTime }),
        ...(item.endTime !== undefined && { endTime: item.endTime }),
        ...(item.room !== undefined && { room: item.room }),
        ...(item.isRepeating !== undefined && { isRepeating: item.isRepeating }),
        ...(item.repeatFrequency !== undefined && { repeatFrequency: item.repeatFrequency }),
        ...(isClass !== undefined && { isClass }),
        ...(scheduleType !== undefined && { scheduleType }),
        ...(item.customCategory !== undefined && { customCategory: item.customCategory }),
        ...(userId && { userId })
      }
    });
  },

  async deleteSchedule(id) {
    await prisma.schedule.delete({
      where: { id }
    });
  }
};
