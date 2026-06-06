import { NotificationRepository } from '../repositories/notification.repository.ts';
import { Prisma } from '@prisma/client';

export class NotificationService {
  static async getAll(userId: string, query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '20');
    const skip = (page - 1) * perPage;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead) where.isRead = query.isRead === 'true';

    const [total, data] = await NotificationRepository.findMany({ skip, take: perPage, where });
    const unreadCount = await NotificationRepository.countUnread(userId);

    return {
      data,
      meta: {
        total,
        unreadCount,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage) || 1
      }
    };
  }

  static async markRead(id: string, userId: string, io: any) {
    const notif = await NotificationRepository.findById(id);
    if (!notif) throw new Error('Notification not found');
    if (notif.userId !== userId) throw new Error('Forbidden');

    const updated = await NotificationRepository.markRead(id);
    if (io) io.to(userId).emit('notification_read', { id });
    return updated;
  }

  static async markAllRead(userId: string, io: any) {
    const updated = await NotificationRepository.markAllRead(userId);
    if (io) io.to(userId).emit('notification_read_all');
    return updated;
  }
}
