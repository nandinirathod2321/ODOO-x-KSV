import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service.js';
import { vendorCreateSchema, vendorUpdateSchema, vendorQuerySchema } from '../validators/vendor.validator.js';

export class VendorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = vendorQuerySchema.parse(req.query);
      const result = await VendorService.getAll(query);
      if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getById(req.params.id as string);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorCreateSchema.parse(req.body);
      const vendor = await VendorService.create(data, req.user!.id);
      successResponse(res, serializeData(vendor ), 'Vendor created');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = vendorUpdateSchema.parse(req.body);
      const vendor = await VendorService.update(req.params.id as string, data, req.user!.id);
      successResponse(res, serializeData(vendor ), 'Vendor updated');
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VendorService.delete(req.params.id as string, req.user!.id);
      successResponse(res, null, 'Vendor deactivated' );
    } catch (e) { next(e); }
  }

  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPerformance(req.params.id as string);
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getRfqs(req.params.id as string, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getQuotations(req.params.id as string, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }

  static async getPos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VendorService.getPos(req.params.id as string, parseInt(req.query.page as string || '1'), parseInt(req.query.perPage as string || '10'));
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }
}
