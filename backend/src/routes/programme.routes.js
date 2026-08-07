import { Router } from 'express';
import { ProgrammeController } from '../controllers/programme.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, ProgrammeController.getProgrammes);
router.post('/', optionalAuth, ProgrammeController.createProgramme);

export default router;
