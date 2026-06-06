import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class QuotationRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.QuotationWhereInput;
    orderBy: Prisma.QuotationOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.quotation.count({ where: params.where }),
      prisma.quotation.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          vendor: { select: { name: true, rating: true } },
          rfq: { select: { title: true, rfqNumber: true, deadline: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: { select: { name: true, email: true, gstNumber: true, contactPerson: true, rating: true } },
        rfq: { select: { title: true, rfqNumber: true } }
      }
    });
  }

  static async findByRfqAndVendor(rfqId: string, vendorId: string) {
    return prisma.quotation.findFirst({ where: { rfqId, vendorId } });
  }

  static async create(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data, include: { items: true } });
  }

  static async update(id: string, data: Prisma.QuotationUpdateInput) {
    return prisma.quotation.update({ where: { id }, data, include: { items: true } });
  }

  static async findAllByRfqForCompare(rfqId: string) {
    return prisma.quotation.findMany({
      where: { rfqId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      include: { vendor: true, items: true }
    });
  }
}
