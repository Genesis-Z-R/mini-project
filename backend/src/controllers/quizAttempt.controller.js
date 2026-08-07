import { QuizAttemptService } from '../services/quizAttempt.service.js';

export const QuizAttemptController = {
  async getQuizAttempts(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      const attempts = await QuizAttemptService.getAttemptsByUser(userId);
      return res.status(200).json(attempts);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async saveQuizAttempt(req, res, next) {
    try {
      const attempt = await QuizAttemptService.createAttempt(req.body);
      return res.status(200).json(attempt);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
