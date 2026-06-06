import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class ActivityLogRepository {
  static async findMany(params: { skip: number; take: number; where: Prisma.ActivityLogWhereInput; orderBy: Prisma.ActivityLogOrderByWithRelationInput }) {
    return prisma.$transaction([
      prisma.activityLog.count({ where: params.where }),
      prisma.activityLog.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: { user: { select: { id: true, name: true, role: true } } }
      })
    ]);
  }

  static async getEventTypes() {
    const types = await prisma.activityLog.findMany({
      distinct: ['eventType'],
      select: { eventType: true }
    });
    return types.map(t => t.eventType);
  }
}
