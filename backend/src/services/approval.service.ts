import { ApprovalRepository } from '../repositories/approval.repository.js';
import { Prisma } from '@prisma/client';

export class ApprovalService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.ApprovalWhereInput = {};
    if (query.status) where.status = query.status;

    let orderBy: any = { requestedAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await ApprovalRepository.findMany({ skip, take: perPage, where, orderBy });
    return { data, meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  static async getById(id: string) {
    const approval = await ApprovalRepository.findById(id);
    if (!approval) throw new Error('Approval request not found');
    return approval;
  }

  static async approve(id: string, approverId: string, remarks?: string) {
    return await ApprovalRepository.updateStatus(id, 'APPROVED', approverId, remarks);
  }

  static async reject(id: string, approverId: string, remarks?: string) {
    return await ApprovalRepository.updateStatus(id, 'REJECTED', approverId, remarks);
  }
}
