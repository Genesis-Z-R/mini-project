import { Router } from 'express';
import { QuizAttemptController } from '../controllers/quizAttempt.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { quizAttemptSchema } from '../schemas/quiz.schema.js';

const router = Router();

router.get('/', optionalAuth, QuizAttemptController.getQuizAttempts);
router.post('/', optionalAuth, validate(quizAttemptSchema), QuizAttemptController.saveQuizAttempt);

export default router;
