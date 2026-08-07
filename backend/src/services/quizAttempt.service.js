import { prisma } from '../config/db.js';

export const QuizAttemptService = {
  async getAttemptsByUser(userId) {
    return await prisma.quizAttempt.findMany({
      where: { userId: userId.trim().toLowerCase() }
    });
  },

  async createAttempt(attemptData) {
    const userId = attemptData.userId.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: { id: userId, email: userId, name: userId.split('@')[0] }
      });
    }

    const id = attemptData.id || `qa_${Date.now()}`;
    return await prisma.quizAttempt.upsert({
      where: { id },
      update: {
        quizId: attemptData.quizId,
        userId,
        score: attemptData.score,
        maxScore: attemptData.maxScore,
        attemptDate: attemptData.attemptDate || new Date().toISOString().split('T')[0]
      },
      create: {
        id,
        quizId: attemptData.quizId,
        userId,
        score: attemptData.score,
        maxScore: attemptData.maxScore,
        attemptDate: attemptData.attemptDate || new Date().toISOString().split('T')[0]
      }
    });
  }
};
