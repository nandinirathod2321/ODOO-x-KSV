import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getAdminDashboard(req: Request, res: Response) {
    try {
      const result = await DashboardService.getAdminStats();
      res.status(200).json({ data: result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
