import prisma from '../config/prisma';

export class PORepository {
  static async findAll() {
    return await prisma.purchaseOrder.findMany();
  }
}
