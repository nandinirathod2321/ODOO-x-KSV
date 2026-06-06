import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { MyService } from '../services/my.service.js';

export class MyController {
  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getRfqs(req.user!.id);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getQuotations(req.user!.id);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getPurchaseOrders(req.user!.id);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getInvoices(req.user!.id);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }
}
