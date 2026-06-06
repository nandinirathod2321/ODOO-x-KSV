import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { RFQService } from '../services/rfq.service.js';
import { createRFQSchema, updateRFQSchema } from '../validators/rfq.validator.js';

export class RFQController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getAll(req.query, req.user!.role, req.user!.id);
      if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getById(req.params.id as string);
      successResponse(res, serializeData(result), 'OK');
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRFQSchema.parse(req.body);
      const result = await RFQService.create(data, req.user!.id);
      successResponse(res, serializeData(result ), 'RFQ created');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRFQSchema.parse(req.body);
      const result = await RFQService.update(req.params.id as string, data, req.user!.id);
      successResponse(res, serializeData(result ), 'RFQ updated');
    } catch (e) { next(e); }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await RFQService.publish(req.params.id as string, req.user!.id, io);
      successResponse(res, serializeData(result ), 'RFQ published');
    } catch (e) { next(e); }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.close(req.params.id as string, req.user!.id);
      successResponse(res, serializeData(result ), 'RFQ closed');
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RFQService.delete(req.params.id as string);
      successResponse(res, null, 'RFQ deleted' );
    } catch (e) { next(e); }
  }
}
