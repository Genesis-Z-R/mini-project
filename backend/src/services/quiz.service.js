import { prisma } from '../config/db.js';

export const QuizService = {
  async getQuizzesByUser(userId, page, limit) {
    const emailKey = userId.trim().toLowerCase();
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const [items, total] = await Promise.all([
        prisma.quiz.findMany({
          where: { userId: emailKey },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.quiz.count({ where: { userId: emailKey } })
      ]);
      return { items, total };
    }
    return await prisma.quiz.findMany({
      where: { userId: emailKey }
    });
  },

  async createQuiz(quizData) {
    const userId = quizData.userId.trim().toLowerCase();
    let profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      await prisma.profile.create({
        data: { id: userId, email: userId, name: userId.split('@')[0] }
      });
    }

    const id = quizData.id || `q_${Date.now()}`;
    return await prisma.quiz.upsert({
      where: { id },
      update: {
        courseId: quizData.courseId,
        courseName: quizData.courseName,
        title: quizData.title,
        questionCount: quizData.questionCount ?? 0,
        type: quizData.type,
        questionsJson: typeof quizData.questionsJson === 'object' ? JSON.stringify(quizData.questionsJson) : (quizData.questionsJson || '[]'),
        userId
      },
      create: {
        id,
        courseId: quizData.courseId,
        courseName: quizData.courseName,
        title: quizData.title,
        questionCount: quizData.questionCount ?? 0,
        type: quizData.type,
        questionsJson: typeof quizData.questionsJson === 'object' ? JSON.stringify(quizData.questionsJson) : (quizData.questionsJson || '[]'),
        userId
      }
    });
  },

  async updateQuiz(id, quizData) {
    const userId = quizData.userId ? quizData.userId.trim().toLowerCase() : undefined;
    return await prisma.quiz.update({
      where: { id },
      data: {
        ...(quizData.courseId !== undefined && { courseId: quizData.courseId }),
        ...(quizData.courseName !== undefined && { courseName: quizName.courseName }),
        ...(quizData.title !== undefined && { title: quizData.title }),
        ...(quizData.questionCount !== undefined && { questionCount: quizData.questionCount }),
        ...(quizData.type !== undefined && { type: quizData.type }),
        ...(quizData.questionsJson !== undefined && {
          questionsJson: typeof quizData.questionsJson === 'object' ? JSON.stringify(quizData.questionsJson) : quizData.questionsJson
        }),
        ...(userId && { userId })
      }
    });
  },

  async deleteQuiz(id) {
    await prisma.quiz.delete({
      where: { id }
    });
  }
};
