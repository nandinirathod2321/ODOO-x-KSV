import { PORepository } from '../repositories/po.repository.js';
import { Prisma } from '@prisma/client';

export class POService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await PORepository.findMany({ skip, take: perPage, where, orderBy });
    return { data, meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  static async getById(id: string) {
    const po = await PORepository.findById(id);
    if (!po) throw new Error('Purchase Order not found');
    return po;
  }
}
