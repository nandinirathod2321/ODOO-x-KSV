import { z } from 'zod';

export const createRFQSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().refine(val => new Date(val) > new Date(), { message: 'Deadline must be in the future' }),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    notes: z.string().optional()
  })).min(1),
  vendorIds: z.array(z.string().uuid()).min(1)
});

export const updateRFQSchema = createRFQSchema.partial().extend({
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    notes: z.string().optional()
  })).optional()
});

export const publishRFQSchema = z.object({});
