import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, NotificationController.getNotifications);
router.patch('/read-all', optionalAuth, NotificationController.markAllAsRead);
router.patch('/:id/read', optionalAuth, NotificationController.markAsRead);
router.delete('/:id', optionalAuth, NotificationController.deleteNotification);

export default router;
