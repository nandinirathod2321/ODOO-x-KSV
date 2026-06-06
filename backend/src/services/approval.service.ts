import { ApprovalRepository } from '../repositories/approval.repository';

export class ApprovalService {
  static async approve(quotationId: string, approverId: string) {
    return await ApprovalRepository.updateStatus(quotationId, 'APPROVED', approverId);
  }
}
