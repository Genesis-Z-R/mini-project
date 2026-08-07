import { z } from 'zod';

export const fileMetadataSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  courseId: z.string().nullable().optional().default('none'),
  fileType: z.string().min(1, 'FileType is required'),
  size: z.string().min(1, 'Size is required'),
  downloads: z.number().int().optional().default(0),
  isPublic: z.boolean().optional().default(true),
  uploadDate: z.string().optional(),
  userId: z.string().min(1, 'userId is required'),
  url: z.string().min(1, 'URL is required')
});

export const toggleVisibilitySchema = z.object({
  isPublic: z.boolean()
});
