import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class InvoiceRepository {
  static async findMany(params: { skip: number; take: number; where: Prisma.InvoiceWhereInput; orderBy: Prisma.InvoiceOrderByWithRelationInput }) {
    return prisma.$transaction([
      prisma.invoice.count({ where: params.where }),
      prisma.invoice.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          purchaseOrder: { select: { poNumber: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: { select: { name: true, address: true, gstNumber: true, contactPerson: true, email: true, userId: true } },
        purchaseOrder: { select: { poNumber: true, deliveryDeadline: true, createdBy: true } }
      }
    });
  }

  static async findByPOId(purchaseOrderId: string) {
    return prisma.invoice.findFirst({ where: { purchaseOrderId } });
  }

  static async update(id: string, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({ where: { id }, data });
  }
}
