import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class ReportsRepository {
  static async getVendorPerformance(filters: any) {
    const whereClause: Prisma.VendorWhereInput = {};
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) whereClause.createdAt.lte = new Date(filters.dateTo);
    }

    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      include: {
        category: true,
        _count: { select: { rfqs: true, quotations: { where: { status: { not: 'DRAFT' } } }, purchaseOrders: true } },
        quotations: { where: { isWinner: true } },
        purchaseOrders: { select: { totalAmount: true } }
      }
    });

    return vendors.map(v => {
      const won = v.quotations.length;
      const submitted = v._count.quotations;
      const winRate = submitted > 0 ? (won / submitted) * 100 : 0;
      const totalPOValue = v.purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

      return {
        vendorId: v.id,
        vendorName: v.name,
        category: v.category?.name || 'Uncategorized',
        rfqsInvited: v._count.rfqs,
        quotationsSubmitted: submitted,
        quotationsWon: won,
        winRate: parseFloat(winRate.toFixed(2)),
        avgDeliveryDays: 0, // Simplified without querying line items
        totalPOValue,
        rating: v.rating
      };
    }).sort((a, b) => b.totalPOValue - a.totalPOValue);
  }

  static async getSpendingSummary(filters: any) {
    const whereClause: Prisma.PurchaseOrderWhereInput = {};
    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) whereClause.createdAt.lte = new Date(filters.dateTo);
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: { vendor: { include: { category: true } } }
    });

    const totalSpendOverall = pos.reduce((sum, po) => sum + po.totalAmount, 0);
    const categoryMap: Record<string, { totalSpend: number; poCount: number }> = {};

    pos.forEach(po => {
      const cat = po.vendor.category?.name || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { totalSpend: 0, poCount: 0 };
      categoryMap[cat].totalSpend += po.totalAmount;
      categoryMap[cat].poCount += 1;
    });

    const data = Object.entries(categoryMap).map(([categoryName, stats]) => ({
      categoryName,
      totalSpend: stats.totalSpend,
      poCount: stats.poCount,
      percentage: totalSpendOverall > 0 ? parseFloat(((stats.totalSpend / totalSpendOverall) * 100).toFixed(2)) : 0
    }));

    return { data, totalSpendOverall };
  }

  static async getMonthlyTrends(year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const pos = await prisma.purchaseOrder.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    const invoices = await prisma.invoice.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } }
    });

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const result = months.map((monthName, index) => ({
      month: index + 1,
      monthName,
      poCount: 0,
      totalPOValue: 0,
      invoiceCount: 0,
      totalInvoiced: 0
    }));

    pos.forEach(po => {
      const m = po.createdAt.getMonth();
      result[m].poCount += 1;
      result[m].totalPOValue += po.totalAmount;
    });

    invoices.forEach(inv => {
      const m = inv.invoiceDate.getMonth();
      result[m].invoiceCount += 1;
      result[m].totalInvoiced += inv.grandTotal;
    });

    return result;
  }

  static async getProcurementStats() {
    const year = new Date().getFullYear();
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const totalSpendYTD = (await prisma.invoice.aggregate({
      where: { invoiceDate: { gte: startDate, lte: endDate }, status: 'PAID' },
      _sum: { grandTotal: true }
    }))._sum.grandTotal || 0;

    const poAgg = await prisma.purchaseOrder.aggregate({
      _avg: { totalAmount: true },
      _count: true
    });
    const avgPOValue = poAgg._avg.totalAmount || 0;
    const poCount = poAgg._count;

    const rfqCount = await prisma.rFQ.count({ where: { status: { in: ['PUBLISHED', 'QUOTATION_RECEIVED', 'AWARDED', 'CLOSED'] } } });
    const rfqToPOConversionRate = rfqCount > 0 ? (poCount / rfqCount) * 100 : 0;

    const quotationCount = await prisma.quotation.count();
    const avgQuotationsPerRFQ = rfqCount > 0 ? quotationCount / rfqCount : 0;

    const vendors = await prisma.vendor.findMany({
      include: { _count: { select: { purchaseOrders: true } } },
      orderBy: { purchaseOrders: { _count: 'desc' } },
      take: 1
    });

    const mostActiveVendor = vendors.length > 0 ? {
      id: vendors[0].id,
      name: vendors[0].name,
      poCount: vendors[0]._count.purchaseOrders
    } : null;

    return {
      totalSpendYTD,
      avgPOValue,
      avgQuotationsPerRFQ: parseFloat(avgQuotationsPerRFQ.toFixed(2)),
      rfqToPOConversionRate: parseFloat(rfqToPOConversionRate.toFixed(2)),
      mostActiveVendor
    };
  }
}
