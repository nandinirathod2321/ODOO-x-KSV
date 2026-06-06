import { z } from 'zod';

export const submitQuotationSchema = z.object({
  rfqId: z.string().uuid(),
  deliveryDays: z.number().min(1),
  validityDate: z.string().refine(val => new Date(val) > new Date(), { message: 'Validity date must be in the future' }),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    rfqItemId: z.string().uuid(),
    description: z.string(),
    quantity: z.number().min(1),
    unit: z.string(),
    unitPrice: z.number().min(0),
    taxPercent: z.number().min(0).default(0)
  })).min(1)
});

export const updateQuotationSchema = submitQuotationSchema.partial().omit({ rfqId: true });

export const selectWinnerSchema = z.object({});
