import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service.js';
import { generateInvoiceSchema, markPaidSchema, sendInvoiceEmailSchema } from '../validators/invoice.validator.js';
import prisma from '../config/prisma.js';

export class InvoiceController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const queryWithUser: any = { ...req.query };
      // Vendors only see their own invoices
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.id } });
        if (vendor) {
          queryWithUser.vendorId = vendor.id;
        } else {
          return paginatedResponse(res, [], { total: 0, page: 1, per_page: 10, last_page: 0 }, 'OK');
        }
      }
      const result = await InvoiceService.getAll(queryWithUser);
      if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getById(req.params.id as string);
      
      // Enforce Vendor access
      if (req.user!.role === 'VENDOR' && result.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      successResponse(res, serializeData(result), 'OK');
    } catch (e) { next(e); }
  }

  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateInvoiceSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.generate(data.purchaseOrderId, req.user!.id, io);
      successResponse(res, serializeData(result ), 'Invoice generated');
    } catch (e) { next(e); }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      markPaidSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await InvoiceService.markPaid(req.params.id as string, req.user!.id, io);
      successResponse(res, serializeData(result ), 'Invoice marked paid');
    } catch (e) { next(e); }
  }

  static async getPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceData = await InvoiceService.getById(req.params.id as string);
      
      if (req.user!.role === 'VENDOR' && invoiceData.invoice.vendor.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const buffer = await InvoiceService.getPdfBuffer(req.params.id as string);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.invoice.invoiceNumber}.pdf`);
      res.send(buffer);
    } catch (e) { next(e); }
  }

  static async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendInvoiceEmailSchema.parse(req.body);
      const io = req.app.get('io');
      await InvoiceService.sendEmail(req.params.id as string, data, req.user!.id, io);
      successResponse(res, null, 'Invoice sent successfully' );
    } catch (e) { next(e); }
  }
}
