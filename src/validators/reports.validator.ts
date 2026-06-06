import { z } from 'zod';

export const vendorPerformanceSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().uuid().optional()
});

export const spendingSummarySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export const monthlyTrendsSchema = z.object({
  year: z.string().regex(/^\d{4}$/).optional()
});

export const reportExportSchema = z.object({
  type: z.enum(['vendor-performance', 'spending-summary', 'monthly-trends']),
  format: z.enum(['csv', 'pdf']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});
