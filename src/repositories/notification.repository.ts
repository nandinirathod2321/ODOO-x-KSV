import prisma from '../config/prisma.ts';
import { Prisma } from '@prisma/client';

export class NotificationRepository {
  static async findMany(params: { skip: number; take: number; where: Prisma.NotificationWhereInput }) {
    return prisma.$transaction([
      prisma.notification.count({ where: params.where }),
      prisma.notification.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: { createdAt: 'desc' }
      })
    ]);
  }

  static async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  static async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  static async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
