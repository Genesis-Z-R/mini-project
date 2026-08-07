import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, SettingsController.getSettings);
router.put('/', optionalAuth, SettingsController.updateSettings);

export default router;
