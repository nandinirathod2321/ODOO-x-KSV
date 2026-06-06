import type { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service.ts';
import { submitQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator.ts';

export class QuotationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.getAll(req.query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.getById(req.params.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitQuotationSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await QuotationService.submit(data, req.user!.id, io);
      res.status(201).json({ message: 'Quotation submitted', data: result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateQuotationSchema.parse(req.body);
      const result = await QuotationService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'Quotation updated', data: result });
    } catch (e) { next(e); }
  }

  static async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.compare(req.params.rfqId, req.user!.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async selectWinner(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await QuotationService.selectWinner(req.params.id, req.user!.id, io);
      res.json({ message: 'Quotation selected and approval created', data: result });
    } catch (e) { next(e); }
  }
}
