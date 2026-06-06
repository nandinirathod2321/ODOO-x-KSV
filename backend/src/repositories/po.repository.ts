import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class PORepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.PurchaseOrderWhereInput;
    orderBy: Prisma.PurchaseOrderOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.purchaseOrder.count({ where: params.where }),
      prisma.purchaseOrder.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          vendor: { select: { name: true, email: true } },
          rfq: { select: { title: true, rfqNumber: true } },
          quotation: { select: { quotationNumber: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        rfq: true,
        quotation: true,
        items: true,
        approval: true
      }
    });
  }
}
