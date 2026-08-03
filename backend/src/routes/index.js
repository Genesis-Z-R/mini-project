import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import courseRoutes from './course.routes.js';
import scheduleRoutes from './schedule.routes.js';
import fileRoutes from './file.routes.js';
import quizRoutes from './quiz.routes.js';
import quizAttemptRoutes from './quizAttempt.routes.js';
import studySessionRoutes from './studySession.routes.js';
import friendshipRoutes from './friendship.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/courses', courseRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/files', fileRoutes);
router.use('/quizzes', quizRoutes);
router.use('/quiz-attempts', quizAttemptRoutes);
router.use('/study-sessions', studySessionRoutes);
router.use('/friendships', friendshipRoutes);

export default router;
