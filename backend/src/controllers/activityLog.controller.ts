import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '../services/activityLog.service.js';
import { activityLogQuerySchema } from '../validators/activityLog.validator.js';

export class ActivityLogController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = activityLogQuerySchema.parse(req.query);
      const result = await ActivityLogService.getAll(query);
      if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }
    } catch (e) { next(e); }
  }

  static async getEventTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ActivityLogService.getEventTypes();
      successResponse(res, serializeData(data), 'OK');
    } catch (e) { next(e); }
  }
}
