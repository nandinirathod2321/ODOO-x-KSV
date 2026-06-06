import { ApprovalRepository } from '../repositories/approval.repository.ts';

export class ApprovalService {
  static async approve(quotationId: string, approverId: string) {
    return await ApprovalRepository.updateStatus(quotationId, 'APPROVED', approverId);
  }
}
