import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service.js';
import { submitQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator.js';
import prisma from '../config/prisma.js';

export class QuotationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const queryWithUser = { ...req.query };
      // If VENDOR, filter to their own quotations only
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.id } });
        if (vendor) {
          queryWithUser.vendorId = vendor.id;
        } else {
          return paginatedResponse(res, [], { total: 0, page: 1, per_page: 10, last_page: 0 }, 'OK');
        }
      }
      const result = await QuotationService.getAll(queryWithUser);
      if (result.meta) {
        paginatedResponse(res, serializeData(result.data), result.meta, 'OK');
      } else {
        successResponse(res, serializeData(result), 'OK');
      }
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.getById(req.params.id as string);
      successResponse(res, serializeData(result), 'OK');
    } catch (e) { next(e); }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitQuotationSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await QuotationService.submit(data, req.user!.id, io);
      successResponse(res, serializeData(result), 'Quotation submitted');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateQuotationSchema.parse(req.body);
      const result = await QuotationService.update(req.params.id as string, data, req.user!.id);
      successResponse(res, serializeData(result), 'Quotation updated');
    } catch (e) { next(e); }
  }

  static async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.compare(req.params.rfqId as string, req.user!.id);
      successResponse(res, serializeData(result), 'OK');
    } catch (e) { next(e); }
  }

  static async selectWinner(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await QuotationService.selectWinner(req.params.id as string, req.user!.id, io);
      successResponse(res, serializeData(result), 'Quotation selected and approval created');
    } catch (e) { next(e); }
  }

  static async simulateBids(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await QuotationService.simulateBids(req.params.rfqId as string, req.user!.id, io);
      successResponse(res, serializeData(result), 'Mock quotations submitted successfully');
    } catch (e) { next(e); }
  }
}
