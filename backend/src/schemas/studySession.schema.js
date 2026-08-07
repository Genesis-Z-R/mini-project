import { z } from 'zod';

export const studySessionSchema = z.object({
  id: z.string().optional(),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  userId: z.string().min(1, 'userId is required')
});
