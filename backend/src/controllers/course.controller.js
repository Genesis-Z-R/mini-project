import { CourseService } from '../services/course.service.js';

export const CourseController = {
  async getCourses(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      const courses = await CourseService.getCoursesByUser(userId);
      return res.status(200).json(courses);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async addCourse(req, res, next) {
    try {
      const course = await CourseService.createCourse(req.body);
      return res.status(200).json(course);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteCourse(req, res, next) {
    try {
      const id = req.params.id;
      await CourseService.deleteCourse(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
