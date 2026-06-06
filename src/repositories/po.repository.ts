import prisma from '../config/prisma.ts';

export class PORepository {
  static async findAll() {
    return await prisma.purchaseOrder.findMany();
  }
}
