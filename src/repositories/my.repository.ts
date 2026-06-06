import prisma from '../config/prisma.ts';

export class MyRepository {
  static async getVendorIdByUserId(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    return vendor?.id;
  }

  static async getRfqs(vendorId: string) {
    return prisma.rFQVendor.findMany({
      where: { vendorId },
      include: { rfq: { include: { _count: { select: { items: true } } } } },
      orderBy: { invitedAt: 'desc' }
    });
  }

  static async getQuotations(vendorId: string) {
    return prisma.quotation.findMany({
      where: { vendorId },
      include: { rfq: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' }
    });
  }

  static async getPurchaseOrders(vendorId: string) {
    return prisma.purchaseOrder.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getInvoices(vendorId: string) {
    return prisma.invoice.findMany({
      where: { vendorId },
      orderBy: { invoiceDate: 'desc' }
    });
  }
}
