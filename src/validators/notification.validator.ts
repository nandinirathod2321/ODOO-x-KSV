import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  perPage: z.string().regex(/^\d+$/).optional(),
  isRead: z.enum(['true', 'false']).optional()
});
