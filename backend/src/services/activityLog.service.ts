import { ActivityLogRepository } from '../repositories/activityLog.repository.js';
import { Prisma } from '@prisma/client';

export class ActivityLogService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const per_page = parseInt(query.per_page || '10');
    const skip = (page - 1) * per_page;

    const where: Prisma.ActivityLogWhereInput = {};
    if (query.search) where.message = { contains: query.search };
    if (query.eventType) where.eventType = query.eventType;
    if (query.entityType) where.entityType = query.entityType;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const orderBy: any = { createdAt: query.sortDir === 'asc' ? 'asc' : 'desc' };

    const [total, data] = await ActivityLogRepository.findMany({ skip, take: per_page, where, orderBy });
    return { data, meta: { total, page, per_page, last_page: Math.ceil(total / per_page) } };
  }

  static async getEventTypes() {
    return await ActivityLogRepository.getEventTypes();
  }
}
