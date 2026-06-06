import prisma from '../config/prisma.ts';

export class DashboardService {
  static async getAdminStats() {
    const vendors = await prisma.vendor.count();
    const rfqs = await prisma.rFQ.count({ where: { status: 'PUBLISHED' } });
    const pendingInvoices = await prisma.invoice.count({ where: { status: 'DRAFT' } });
    const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } });
    const recentInvoices = await prisma.invoice.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    return { totalVendors: vendors, activeRFQs: rfqs, pendingInvoices, paidInvoices, recentInvoices };
  }
}
