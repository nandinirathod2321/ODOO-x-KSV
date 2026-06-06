import { ReportsRepository } from '../repositories/reports.repository.js';
import { buildCSV, buildReportHTML } from '../utils/exportHelpers.js';
import { PDFService } from './pdf.service.js';

export class ReportsService {
  static async getVendorPerformance(filters: any) {
    return await ReportsRepository.getVendorPerformance(filters);
  }

  static async getSpendingSummary(filters: any) {
    return await ReportsRepository.getSpendingSummary(filters);
  }

  static async getMonthlyTrends(year: string) {
    return await ReportsRepository.getMonthlyTrends(parseInt(year || new Date().getFullYear().toString()));
  }

  static async getProcurementStats() {
    return await ReportsRepository.getProcurementStats();
  }

  static async exportReport(params: any) {
    let data: any[] = [];
    let title = '';
    
    if (params.type === 'vendor-performance') {
      data = await this.getVendorPerformance({ dateFrom: params.dateFrom, dateTo: params.dateTo });
      title = 'Vendor Performance Report';
    } else if (params.type === 'spending-summary') {
      const result = await this.getSpendingSummary({ dateFrom: params.dateFrom, dateTo: params.dateTo });
      data = result.data; // export array part
      title = 'Spending Summary Report';
    } else if (params.type === 'monthly-trends') {
      data = await this.getMonthlyTrends(new Date().getFullYear().toString());
      title = 'Monthly Trends Report';
    } else {
      throw new Error('Invalid report type');
    }

    if (params.format === 'csv') {
      return { buffer: Buffer.from(buildCSV(data)), contentType: 'text/csv' };
    } else {
      const html = buildReportHTML(title, data);
      const buffer = await PDFService.generatePDF(html); // Using generic PDF method
      return { buffer, contentType: 'application/pdf' };
    }
  }
}
