import { z } from 'zod';

export const scheduleSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  day: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().nullable().optional(),
  isRepeating: z.boolean().optional().default(true),
  repeatFrequency: z.string().optional().default('weekly'),
  isClass: z.boolean().optional().default(true),
  scheduleType: z.string().optional().default('CLASS'),
  customCategory: z.string().nullable().optional(),
  userId: z.string().min(1, 'userId is required')
});
