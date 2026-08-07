import { z } from 'zod';

export const friendshipSchema = z.object({
  id: z.string().optional(),
  senderId: z.string().min(1, 'senderId is required'),
  receiverId: z.string().min(1, 'receiverId is required'),
  status: z.string().optional().default('pending')
});
