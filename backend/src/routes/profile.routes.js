import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware.js';
import { profileSeedSchema, profileUpdateSchema } from '../schemas/profile.schema.js';

const router = Router();

router.post('/seed', optionalAuth, validate(profileSeedSchema), ProfileController.seedProfile);
router.get('/', optionalAuth, ProfileController.getAllProfiles);
router.get('/:email', optionalAuth, ProfileController.getProfile);
router.put('/:email', optionalAuth, validate(profileUpdateSchema), ProfileController.updateProfile);

export default router;
