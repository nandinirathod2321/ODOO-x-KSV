import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { notificationQuerySchema } from '../validators/notification.validator.js';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = notificationQuerySchema.parse(req.query);
      const result = await NotificationService.getAll(req.user!.id, query);
      if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }
    } catch (e) { next(e); }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      await NotificationService.markRead(req.params.id as string, req.user!.id, io);
      successResponse(res, null, 'Notification marked as read' );
    } catch (e) { next(e); }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      await NotificationService.markAllRead(req.user!.id, io);
      successResponse(res, null, 'All notifications marked as read' );
    } catch (e) { next(e); }
  }
}
