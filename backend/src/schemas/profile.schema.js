import { z } from 'zod';

export const profileSeedSchema = z.object({
  email: z.string().email('Invalid email address format'),
  name: z.string().min(1, 'Name is required')
});

export const profileUpdateSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email address format').optional(),
  name: z.string().optional(),
  indexNumber: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  programmeId: z.string().nullable().optional(),
  programmeName: z.string().nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  dailyDigestEnabled: z.boolean().optional(),
  isDarkMode: z.boolean().optional(),
  publicResourceDirectoryEnabled: z.boolean().optional(),
  publicProfileEnabled: z.boolean().optional(),
  pushNotificationsMaster: z.boolean().optional(),
  classRemindersEnabled: z.boolean().optional(),
  studySessionRemindersEnabled: z.boolean().optional(),
  eventRemindersEnabled: z.boolean().optional(),
  friendRequestReceivedEnabled: z.boolean().optional(),
  friendRequestAcceptedEnabled: z.boolean().optional(),
  friendResourceUploadEnabled: z.boolean().optional(),
  friendCourseResourceUploadEnabled: z.boolean().optional()
});
