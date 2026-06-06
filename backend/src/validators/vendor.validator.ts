import { z } from 'zod';

export const vendorCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  gstNumber: z.string().max(20).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  categoryId: z.string().uuid().optional()
});

export const vendorUpdateSchema = vendorCreateSchema.partial();

export const vendorQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  perPage: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'rating', 'status']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});
