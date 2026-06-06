import { Request, Response, NextFunction } from 'express';
import { LookupService } from '../services/lookup.service.js';

export class LookupController {
  static async getVendorCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await LookupService.getVendorCategories();
      res.json({ data });
    } catch (e) { next(e); }
  }

  static getVendorStatuses(req: Request, res: Response) { res.json(LookupService.getVendorStatuses()); }
  static getRfqStatuses(req: Request, res: Response) { res.json(LookupService.getRfqStatuses()); }
  static getQuotationStatuses(req: Request, res: Response) { res.json(LookupService.getQuotationStatuses()); }
  static getPoStatuses(req: Request, res: Response) { res.json(LookupService.getPoStatuses()); }
  static getInvoiceStatuses(req: Request, res: Response) { res.json(LookupService.getInvoiceStatuses()); }
  static getRoles(req: Request, res: Response) { res.json(LookupService.getRoles()); }
  static getUnits(req: Request, res: Response) { res.json(LookupService.getUnits()); }

  static async getActivityEventTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await LookupService.getActivityEventTypes();
      res.json(data);
    } catch (e) { next(e); }
  }
}
