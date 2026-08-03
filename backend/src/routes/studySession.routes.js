import { Router } from 'express';
import { StudySessionController } from '../controllers/studySession.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { studySessionSchema } from '../schemas/studySession.schema.js';

const router = Router();

router.get('/', optionalAuth, StudySessionController.getStudySessions);
router.post('/', optionalAuth, validate(studySessionSchema), StudySessionController.saveStudySession);

export default router;
