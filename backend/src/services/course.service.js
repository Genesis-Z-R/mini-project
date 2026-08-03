import { prisma } from '../config/db.js';

export const CourseService = {
  async getCoursesByUser(userId) {
    return await prisma.course.findMany({
      where: { userId: userId.trim().toLowerCase() }
    });
  },

  async createCourse(courseData) {
    const userId = courseData.userId.trim().toLowerCase();

    // Ensure Profile exists before inserting course
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: {
          id: userId,
          email: userId,
          name: userId.split('@')[0]
        }
      });
    }

    const id = courseData.id || `c_${Date.now()}`;
    return await prisma.course.upsert({
      where: { id },
      update: {
        name: courseData.name,
        code: courseData.code,
        room: courseData.room,
        userId
      },
      create: {
        id,
        name: courseData.name,
        code: courseData.code,
        room: courseData.room,
        userId
      }
    });
  },

  async deleteCourse(id) {
    await prisma.course.delete({
      where: { id }
    });
  }
};
