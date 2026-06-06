import { z } from 'zod';

export const generateInvoiceSchema = z.object({
  purchaseOrderId: z.string().uuid()
});

export const markPaidSchema = z.object({});

export const sendInvoiceEmailSchema = z.object({
  toEmail: z.string().email(),
  ccEmail: z.string().email().optional(),
  subject: z.string().min(1),
  body: z.string().optional()
});
