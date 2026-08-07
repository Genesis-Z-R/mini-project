import { ProfileService } from '../services/profile.service.js';

export const SettingsController = {
  async getSettings(req, res) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json({});
      }
      const profile = await ProfileService.getProfileByEmail(userId);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateSettings(req, res) {
    try {
      const userId = req.query.userId || req.body.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
      }
      const updated = await ProfileService.updateProfile(userId, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
