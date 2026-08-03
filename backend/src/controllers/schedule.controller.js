import { ScheduleService } from '../services/schedule.service.js';

export const ScheduleController = {
  async getSchedule(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      const items = await ScheduleService.getScheduleByUser(userId);
      return res.status(200).json(items);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async addScheduleItem(req, res, next) {
    try {
      const item = await ScheduleService.createSchedule(req.body);
      return res.status(200).json(item);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateScheduleItem(req, res, next) {
    try {
      const id = req.params.id;
      const updated = await ScheduleService.updateSchedule(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeScheduleItem(req, res, next) {
    try {
      const id = req.params.id;
      await ScheduleService.deleteSchedule(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
