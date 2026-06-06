import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { notificationQuerySchema } from '../validators/notification.validator.js';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = notificationQuerySchema.parse(req.query);
      const result = await NotificationService.getAll(req.user!.id, query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      await NotificationService.markRead(req.params.id, req.user!.id, io);
      res.json({ message: 'Notification marked as read' });
    } catch (e) { next(e); }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      await NotificationService.markAllRead(req.user!.id, io);
      res.json({ message: 'All notifications marked as read' });
    } catch (e) { next(e); }
  }
}
