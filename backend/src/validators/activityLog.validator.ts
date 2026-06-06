import { z } from 'zod';

export const activityLogQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  perPage: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  eventType: z.string().optional(),
  entityType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});
