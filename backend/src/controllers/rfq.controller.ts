import { Request, Response, NextFunction } from 'express';
import { RFQService } from '../services/rfq.service.js';
import { createRFQSchema, updateRFQSchema } from '../validators/rfq.validator.js';

export class RFQController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getAll(req.query, req.user!.role, req.user!.id);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getById(req.params.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRFQSchema.parse(req.body);
      const result = await RFQService.create(data, req.user!.id);
      res.status(201).json({ message: 'RFQ created', data: result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRFQSchema.parse(req.body);
      const result = await RFQService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'RFQ updated', data: result });
    } catch (e) { next(e); }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await RFQService.publish(req.params.id, req.user!.id, io);
      res.json({ message: 'RFQ published', data: result });
    } catch (e) { next(e); }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.close(req.params.id, req.user!.id);
      res.json({ message: 'RFQ closed', data: result });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RFQService.delete(req.params.id);
      res.json({ message: 'RFQ deleted' });
    } catch (e) { next(e); }
  }
}
