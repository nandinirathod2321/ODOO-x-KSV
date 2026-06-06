import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service.js';
import { vendorCreateSchema, vendorUpdateSchema, vendorQuerySchema } from '../validators/vendor.validator.js';

export class VendorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = vendorQuerySchema.parse(req.query);
      const result = await VendorService.getAll(query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getById(req.params.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorCreateSchema.parse(req.body);
      const vendor = await VendorService.create(data, req.user!.id);
      res.status(201).json({ message: 'Vendor created', data: vendor });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorUpdateSchema.parse(req.body);
      const vendor = await VendorService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'Vendor updated', data: vendor });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VendorService.delete(req.params.id, req.user!.id);
      res.json({ message: 'Vendor deactivated' });
    } catch (e) { next(e); }
  }

  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPerformance(req.params.id);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getRfqs(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getQuotations(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getPos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPos(req.params.id, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      res.json({ data });
    } catch (e) { next(e); }
  }
}
