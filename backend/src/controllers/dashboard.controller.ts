import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  static async getAdminDashboard(req: Request, res: Response) {
    try {
      const result = await DashboardService.getAdminStats();
      successResponse(res, serializeData(result), 'OK');
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
