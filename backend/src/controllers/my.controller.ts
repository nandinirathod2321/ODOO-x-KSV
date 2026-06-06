import { Request, Response, NextFunction } from 'express';
import { MyService } from '../services/my.service.js';

export class MyController {
  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getRfqs(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getQuotations(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getPurchaseOrders(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MyService.getInvoices(req.user!.id);
      res.json({ data });
    } catch (e) { next(e); }
  }
}
