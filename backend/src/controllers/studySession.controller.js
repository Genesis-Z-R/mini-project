import { StudySessionService } from '../services/studySession.service.js';
import { formatPaginatedResponse } from '../utils/response.js';

export const StudySessionController = {
  async getStudySessions(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      const { page, limit } = req.query;
      if (!userId) {
        return res.status(200).json(formatPaginatedResponse([], 0, page, limit));
      }
      const result = await StudySessionService.getSessionsByUser(userId, page, limit);
      if (page && limit) {
        return res.status(200).json(formatPaginatedResponse(result.items, result.total, page, limit));
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveStudySession(req, res, next) {
    try {
      const session = await StudySessionService.createSession(req.body);
      return res.status(200).json(session);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
