import prisma from '../config/prisma.js';

export class LookupRepository {
  static async getVendorCategories() {
    return prisma.vendorCategory.findMany();
  }

  static async getActivityEventTypes() {
    const events = await prisma.activityLog.findMany({
      distinct: ['eventType'],
      select: { eventType: true }
    });
    return events.map(e => e.eventType);
  }
}
