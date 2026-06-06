import { RFQRepository } from '../repositories/rfq.repository.js';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { generateRFQNumber } from '../utils/numberGenerator.js';
import { ROLES } from '../constants/permissions.js';

export class RFQService {
  static async getAll(query: any, userRole: string, userId: string) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.RFQWhereInput = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { rfqNumber: { contains: query.search } }
      ];
    }
    if (query.status) where.status = query.status;

    if (userRole === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      if (vendor) {
        where.vendors = { some: { vendorId: vendor.id } };
        where.status = { in: ['PUBLISHED', 'QUOTATION_RECEIVED', 'AWARDED', 'CLOSED'] };
      } else {
        return { data: [], meta: { total: 0, page, perPage, lastPage: 0 } };
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await RFQRepository.findMany({ skip, take: perPage, where, orderBy });
    
    return { data, meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  static async getById(id: string) {
    const rfq = await RFQRepository.findById(id);
    if (!rfq) throw new Error('RFQ not found');

    const createdBy = await prisma.user.findUnique({ where: { id: rfq.createdBy }, select: { name: true, role: true } });

    return { ...rfq, createdByObj: createdBy };
  }

  static async create(data: any, adminId: string) {
    const rfqNumber = await generateRFQNumber();
    
    const rfq = await prisma.$transaction(async (tx) => {
      const newRfq = await tx.rFQ.create({
        data: {
          rfqNumber,
          title: data.title,
          description: data.description,
          deadline: new Date(data.deadline),
          status: 'DRAFT',
          createdBy: adminId,
          items: {
            create: data.items.map((i: any) => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              notes: i.notes
            }))
          },
          vendors: {
            create: data.vendorIds.map((vId: string) => ({ vendorId: vId }))
          }
        },
        include: { items: true, vendors: true }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'rfq_created',
          entityType: 'RFQ',
          entityId: newRfq.id,
          message: `RFQ ${rfqNumber} was created`
        }
      });

      for (const v of data.vendorIds) {
        const vendor = await tx.vendor.findUnique({ where: { id: v } });
        if (vendor && vendor.userId) {
          await tx.notification.create({
            data: {
              userId: vendor.userId,
              title: 'New RFQ Created',
              message: `You have been assigned to RFQ ${rfqNumber} (Draft).`,
              type: 'rfq_created',
              referenceType: 'RFQ',
              referenceId: newRfq.id
            }
          });
        }
      }

      return newRfq;
    });

    return rfq;
  }

  static async update(id: string, data: any, adminId: string) {
    const rfq = await RFQRepository.findById(id);
    if (!rfq) throw new Error('RFQ not found');
    if (rfq.status !== 'DRAFT') throw new Error('Only DRAFT RFQs can be updated');

    return await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.rFQItem.deleteMany({ where: { rfqId: id } });
        await tx.rFQItem.createMany({
          data: data.items.map((i: any) => ({
            rfqId: id,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes
          }))
        });
      }

      if (data.vendorIds) {
        await tx.rFQVendor.deleteMany({ where: { rfqId: id } });
        await tx.rFQVendor.createMany({
          data: data.vendorIds.map((vId: string) => ({
            rfqId: id,
            vendorId: vId
          }))
        });
      }

      const updatedRfq = await tx.rFQ.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          deadline: data.deadline ? new Date(data.deadline) : undefined
        }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'rfq_updated',
          entityType: 'RFQ',
          entityId: id,
          message: `RFQ ${rfq.rfqNumber} was updated`
        }
      });

      return updatedRfq;
    });
  }

  static async publish(id: string, adminId: string, io: any) {
    const rfq = await RFQRepository.findById(id);
    if (!rfq) throw new Error('RFQ not found');
    if (rfq.status !== 'DRAFT') throw new Error('Only DRAFT RFQs can be published');

    return await prisma.$transaction(async (tx) => {
      const updatedRfq = await tx.rFQ.update({
        where: { id },
        data: { status: 'PUBLISHED' }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'rfq_published',
          entityType: 'RFQ',
          entityId: id,
          message: `RFQ ${rfq.rfqNumber} was published`
        }
      });

      const assignedVendors = await tx.rFQVendor.findMany({ where: { rfqId: id }, include: { vendor: true } });
      
      for (const rv of assignedVendors) {
        if (rv.vendor.userId) {
          await tx.notification.create({
            data: {
              userId: rv.vendor.userId,
              title: 'New RFQ Available',
              message: `RFQ ${rfq.rfqNumber} has been published and is awaiting your quotation.`,
              type: 'rfq_published',
              referenceType: 'RFQ',
              referenceId: id
            }
          });
        }
      }

      if (io) io.emit('rfq_published', { rfqId: id, rfqNumber: rfq.rfqNumber });

      return updatedRfq;
    });
  }

  static async close(id: string, adminId: string) {
    const rfq = await prisma.rFQ.update({ where: { id }, data: { status: 'CLOSED' } });
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'rfq_closed',
        entityType: 'RFQ',
        entityId: id,
        message: `RFQ ${rfq.rfqNumber} was closed`
      }
    });
    return rfq;
  }

  static async delete(id: string) {
    const rfq = await RFQRepository.findById(id);
    if (!rfq) throw new Error('RFQ not found');
    if (rfq.status !== 'DRAFT') throw new Error('Only DRAFT RFQs can be deleted');
    return await RFQRepository.delete(id);
  }
}
