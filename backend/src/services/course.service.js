import { prisma } from '../config/db.js';

const normalizeCode = (code) => {
  return code ? code.trim().toUpperCase().replace(/\s+/g, '') : '';
};

const normalizeName = (name) => {
  return name ? name.trim().toUpperCase().replace(/\s+/g, '') : '';
};

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

    // Check duplicates for this user
    const existingCourses = await prisma.course.findMany({
      where: { userId }
    });

    const normCode = normalizeCode(courseData.code);
    const normName = normalizeName(courseData.name);

    for (const c of existingCourses) {
      if (normalizeCode(c.code) === normCode) {
        const error = new Error('A course with this code already exists.');
        error.statusCode = 409;
        throw error;
      }
      if (normalizeName(c.name) === normName) {
        const error = new Error('A course with this name already exists.');
        error.statusCode = 409;
        throw error;
      }
    }

    const id = courseData.id || `c_${Date.now()}`;
    return await prisma.course.create({
      data: {
        id,
        name: courseData.name.trim(),
        code: courseData.code.trim().toUpperCase(),
        room: courseData.room ? courseData.room.trim() : 'Online',
        userId
      }
    });
  },

  async updateCourse(id, courseData) {
    const userId = courseData.userId.trim().toLowerCase();

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      throw error;
    }

    // Check duplicates among other courses for this user
    const otherCourses = await prisma.course.findMany({
      where: {
        userId,
        id: { not: id }
      }
    });

    const normCode = normalizeCode(courseData.code);
    const normName = normalizeName(courseData.name);

    for (const c of otherCourses) {
      if (normalizeCode(c.code) === normCode) {
        const error = new Error('A course with this code already exists.');
        error.statusCode = 409;
        throw error;
      }
      if (normalizeName(c.name) === normName) {
        const error = new Error('A course with this name already exists.');
        error.statusCode = 409;
        throw error;
      }
    }

    return await prisma.course.update({
      where: { id },
      data: {
        name: courseData.name.trim(),
        code: courseData.code.trim().toUpperCase(),
        room: courseData.room ? courseData.room.trim() : 'Online'
      }
    });
  },

  async deleteCourse(id) {
    await prisma.course.delete({
      where: { id }
    });
  }
};
