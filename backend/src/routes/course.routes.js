import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { authorizeOwnership } from '../middlewares/ownership.middleware.js';
import { courseSchema } from '../schemas/course.schema.js';

const router = Router();

router.get('/', optionalAuth, CourseController.getCourses);
router.post('/', optionalAuth, validate(courseSchema), CourseController.addCourse);
router.delete('/:id', optionalAuth, authorizeOwnership('Course', 'userId', 'id'), CourseController.deleteCourse);

export default router;
