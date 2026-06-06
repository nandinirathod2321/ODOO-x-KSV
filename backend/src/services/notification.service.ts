import { NotificationRepository } from '../repositories/notification.repository.js';
import { Prisma } from '@prisma/client';

export class NotificationService {
  static async getAll(userId: string, query: any) {
    const page = parseInt(query.page || '1');
    const per_page = parseInt(query.per_page || '20');
    const skip = (page - 1) * per_page;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead) where.isRead = query.isRead === 'true';

    const [total, data] = await NotificationRepository.findMany({ skip, take: per_page, where });
    const unreadCount = await NotificationRepository.countUnread(userId);

    return {
      data,
      meta: {
        total,
        unreadCount,
        page,
        per_page,
        last_page: Math.ceil(total / per_page) || 1
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
