import { QuizService } from '../services/quiz.service.js';
import { formatPaginatedResponse } from '../utils/response.js';

export const QuizController = {
  async getQuizzes(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      const { page, limit } = req.query;
      if (!userId) {
        return res.status(200).json(formatPaginatedResponse([], 0, page, limit));
      }
      const result = await QuizService.getQuizzesByUser(userId, page, limit);
      if (page && limit) {
        return res.status(200).json(formatPaginatedResponse(result.items, result.total, page, limit));
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async addQuiz(req, res, next) {
    try {
      const quiz = await QuizService.createQuiz(req.body);
      return res.status(200).json(quiz);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateQuiz(req, res, next) {
    try {
      const id = req.params.id;
      const updated = await QuizService.updateQuiz(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteQuiz(req, res, next) {
    try {
      const id = req.params.id;
      await QuizService.deleteQuiz(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
