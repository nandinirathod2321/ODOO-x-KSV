import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class VendorRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.VendorWhereInput;
    orderBy: Prisma.VendorOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.vendor.count({ where: params.where }),
      prisma.vendor.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: { category: true }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
      include: { category: true, user: { select: { id: true, name: true, email: true, role: true, isActive: true } } }
    });
  }

  static async create(data: Prisma.VendorCreateInput) {
    return prisma.vendor.create({ data, include: { category: true } });
  }

  static async update(id: string, data: Prisma.VendorUpdateInput) {
    return prisma.vendor.update({ where: { id }, data });
  }

  static async getPerformanceMetrics(vendorId: string) {
    const totalRfqsInvited = await prisma.rFQVendor.count({ where: { vendorId } });
    const totalQuotationsSubmitted = await prisma.quotation.count({ where: { vendorId } });
    const totalPosReceived = await prisma.purchaseOrder.count({ where: { vendorId } });
    const totalInvoices = await prisma.invoice.count({ where: { vendorId } });
    
    const selectedQuotations = await prisma.quotation.count({ where: { vendorId, isWinner: true } });
    
    const winRate = totalQuotationsSubmitted > 0 ? (selectedQuotations / totalQuotationsSubmitted) * 100 : 0;

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { rating: true, averageResponseTimeHours: true } });

    return {
      totalRfqsInvited,
      totalQuotationsSubmitted,
      totalPosReceived,
      totalInvoices,
      averageDeliveryDays: 0, // Requires more complex query across quotation items or deliveryDays fields
      winRate,
      rating: vendor?.rating || 0
    };
  }

  static async findVendorRfqs(vendorId: string, skip: number, take: number) {
    return prisma.rFQVendor.findMany({
      where: { vendorId },
      include: { rfq: true },
      skip, take, orderBy: { invitedAt: 'desc' }
    });
  }

  static async findVendorQuotations(vendorId: string, skip: number, take: number) {
    return prisma.quotation.findMany({
      where: { vendorId },
      include: { rfq: { select: { title: true } } },
      skip, take, orderBy: { submittedAt: 'desc' }
    });
  }

  static async findVendorPos(vendorId: string, skip: number, take: number) {
    return prisma.purchaseOrder.findMany({
      where: { vendorId },
      skip, take, orderBy: { createdAt: 'desc' }
    });
  }
}
