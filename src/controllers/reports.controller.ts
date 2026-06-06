import type { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service.ts';
import { vendorPerformanceSchema, spendingSummarySchema, monthlyTrendsSchema, reportExportSchema } from '../validators/reports.validator.ts';

export class ReportsController {
  static async getVendorPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = vendorPerformanceSchema.parse(req.query);
      const data = await ReportsService.getVendorPerformance(filters);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async getSpendingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = spendingSummarySchema.parse(req.query);
      const result = await ReportsService.getSpendingSummary(filters);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getMonthlyTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = monthlyTrendsSchema.parse(req.query);
      const data = await ReportsService.getMonthlyTrends(filters.year || '');
      res.json(data);
    } catch (e) { next(e); }
  }

  static async getProcurementStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getProcurementStats();
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const params = reportExportSchema.parse(req.query);
      const { buffer, contentType } = await ReportsService.exportReport(params);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `report-${params.type}-${date}.${params.format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (e) { next(e); }
  }
}
