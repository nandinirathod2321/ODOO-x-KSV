import { Request, Response } from 'express';
import { POService } from '../services/po.service';

export class POController {
  static async getPOs(req: Request, res: Response) {
    try {
      const result = await POService.getAll();
      res.status(200).json({ data: result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
