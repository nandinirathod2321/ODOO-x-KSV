import type { Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service.ts';

export class ApprovalController {
  static async approve(req: Request, res: Response) {
    try {
      const result = await ApprovalService.approve(req.params.quotationId, req.user.id);
      res.status(200).json({ message: 'Approved', data: result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
