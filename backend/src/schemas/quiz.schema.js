import { z } from 'zod';

export const quizSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(),
  title: z.string().min(1, 'Quiz title is required'),
  questionCount: z.number().int().optional().default(0),
  type: z.string().nullable().optional(),
  questionsJson: z.string().optional().default('[]'),
  userId: z.string().min(1, 'userId is required')
});

export const quizAttemptSchema = z.object({
  id: z.string().optional(),
  quizId: z.string().min(1, 'quizId is required'),
  userId: z.string().min(1, 'userId is required'),
  score: z.number(),
  maxScore: z.number(),
  attemptDate: z.string().optional()
});
