import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class RFQRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.RFQWhereInput;
    orderBy: Prisma.RFQOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.rFQ.count({ where: params.where }),
      prisma.rFQ.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true, vendors: true, quotations: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        vendors: {
          include: {
            vendor: { select: { id: true, name: true, status: true, rating: true, category: true } }
          }
        },
        quotations: {
          select: { id: true, vendor: { select: { name: true } }, status: true, totalAmount: true }
        }
      }
    });
  }

  static async create(data: Prisma.RFQCreateInput) {
    return prisma.rFQ.create({ data, include: { items: true, vendors: true } });
  }

  static async update(id: string, data: Prisma.RFQUpdateInput) {
    return prisma.rFQ.update({ where: { id }, data, include: { items: true, vendors: true } });
  }

  static async delete(id: string) {
    return prisma.rFQ.delete({ where: { id } });
  }
}
