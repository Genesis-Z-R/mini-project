import { NotificationService } from '../services/notification.service.js';

export const NotificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      
      // Auto-check for digest & event reminders
      await NotificationService.generateDailyDigest(userId);
      await NotificationService.generateEventReminders(userId);

      const notifications = await NotificationService.getUserNotifications(userId);
      return res.status(200).json(notifications);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const id = req.params.id;
      const updated = await NotificationService.markAsRead(id);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.query.userId || req.body.userId || (req.user ? req.user.email : '');
      await NotificationService.markAllAsRead(userId);
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteNotification(req, res) {
    try {
      const id = req.params.id;
      await NotificationService.deleteNotification(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
