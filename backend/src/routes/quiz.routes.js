import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { authorizeOwnership } from '../middlewares/ownership.middleware.js';
import { quizSchema } from '../schemas/quiz.schema.js';

const router = Router();

router.get('/', optionalAuth, QuizController.getQuizzes);
router.post('/', optionalAuth, validate(quizSchema), QuizController.addQuiz);
router.put('/:id', optionalAuth, authorizeOwnership('Quiz', 'userId', 'id'), QuizController.updateQuiz);
router.delete('/:id', optionalAuth, authorizeOwnership('Quiz', 'userId', 'id'), QuizController.deleteQuiz);

export default router;
