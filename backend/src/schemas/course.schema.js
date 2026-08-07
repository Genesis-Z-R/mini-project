import { z } from 'zod';

export const courseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  room: z.string().nullable().optional(),
  userId: z.string().min(1, 'userId is required')
});
