import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '../services/activityLog.service.js';
import { activityLogQuerySchema } from '../validators/activityLog.validator.js';

export class ActivityLogController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = activityLogQuerySchema.parse(req.query);
      const result = await ActivityLogService.getAll(query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getEventTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ActivityLogService.getEventTypes();
      res.json({ data });
    } catch (e) { next(e); }
  }
}
