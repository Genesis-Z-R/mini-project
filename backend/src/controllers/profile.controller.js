import { ProfileService } from '../services/profile.service.js';
import { formatPaginatedResponse } from '../utils/response.js';

export const ProfileController = {
  async seedProfile(req, res, next) {
    try {
      const { email, name } = req.body;
      await ProfileService.seedProfile(email, name);
      return res.status(200).send();
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async getProfile(req, res, next) {
    try {
      const email = decodeURIComponent(req.params.email);
      const profile = await ProfileService.getProfileByEmail(email);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req, res, next) {
    try {
      const email = decodeURIComponent(req.params.email);
      const updated = await ProfileService.updateProfile(email, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAllProfiles(req, res, next) {
    try {
      const profiles = await ProfileService.getAllProfiles();
      const { page, limit } = req.query;
      return res.status(200).json(formatPaginatedResponse(profiles, profiles.length, page, limit));
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
