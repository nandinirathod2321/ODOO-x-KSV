import prisma from '../lib/prisma.js';

export class QuotationRepository {
  async create(data) {
    return prisma.quotation.create({ data });
  }

  async findByRfq(rfqId) {
    return prisma.quotation.findMany({
      where: { rfq_id: rfqId },
      include: { vendor: true }
    });
  }

  async updateStatus(id, status) {
    return prisma.quotation.update({
      where: { id },
      data: { status }
    });
  }
}
