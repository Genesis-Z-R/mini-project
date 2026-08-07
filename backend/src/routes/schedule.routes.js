import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { authorizeOwnership } from '../middlewares/ownership.middleware.js';
import { scheduleSchema } from '../schemas/schedule.schema.js';

const router = Router();

router.get('/', optionalAuth, ScheduleController.getSchedule);
router.post('/', optionalAuth, validate(scheduleSchema), ScheduleController.addScheduleItem);
router.put('/:id', optionalAuth, authorizeOwnership('Schedule', 'userId', 'id'), ScheduleController.updateScheduleItem);
router.delete('/:id', optionalAuth, authorizeOwnership('Schedule', 'userId', 'id'), ScheduleController.removeScheduleItem);

export default router;
