import type { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service.ts';
import { generateInvoiceSchema, markPaidSchema, sendInvoiceEmailSchema } from '../validators/invoice.validator.ts';

export class InvoiceController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getAll(req.query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getById(req.params.id);
      
      // Enforce Vendor access
      if (req.user!.role === 'VENDOR' && result.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateInvoiceSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.generate(data.purchaseOrderId, req.user!.id, io);
      res.status(201).json({ message: 'Invoice generated', data: result });
    } catch (e) { next(e); }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      markPaidSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.markPaid(req.params.id, req.user!.id, io);
      res.json({ message: 'Invoice marked paid', data: result });
    } catch (e) { next(e); }
  }

  static async getPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceData = await InvoiceService.getById(req.params.id);
      
      if (req.user!.role === 'VENDOR' && invoiceData.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const buffer = await InvoiceService.getPdfBuffer(req.params.id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.invoice.invoiceNumber}.pdf`);
      res.send(buffer);
    } catch (e) { next(e); }
  }

  static async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendInvoiceEmailSchema.parse(req.body);
      const io = req.app.get('io');
      await InvoiceService.sendEmail(req.params.id, data, req.user!.id, io);
      res.json({ message: 'Invoice sent successfully' });
    } catch (e) { next(e); }
  }
}
