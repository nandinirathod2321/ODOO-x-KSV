import prisma from '../config/prisma';

export class ApprovalRepository {
  static async updateStatus(quotationId: string, status: string, approverId: string) {
    // Dummy logic
    return { quotationId, status, approverId };
  }
}
