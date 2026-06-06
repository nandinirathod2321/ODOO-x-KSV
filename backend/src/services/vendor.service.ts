import { VendorRepository } from '../repositories/vendor.repository.js';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class VendorService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.VendorWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { gstNumber: { contains: query.search } }
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await VendorRepository.findMany({ skip, take: perPage, where, orderBy });
    
    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage)
      }
    };
  }

  static async getById(id: string) {
    const vendor = await VendorRepository.findById(id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  static async create(data: any, adminId: string) {
    // Generate placeholder user if email doesn't exist
    const vendorUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || `vendor-${Date.now()}@example.com`,
        password: 'ChangeMe123!',
        role: 'VENDOR'
      }
    });

    const vendor = await VendorRepository.create({
      ...data,
      user: { connect: { id: vendorUser.id } },
      ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {})
    });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_created',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: `Vendor ${vendor.name} was registered`
      }
    });

    await prisma.notification.create({
      data: {
        userId: vendorUser.id,
        title: 'Vendor Account Created',
        message: 'Your vendor account has been created.',
        type: 'vendor_created'
      }
    });

    return vendor;
  }

  static async update(id: string, data: any, adminId: string) {
    const vendor = await VendorRepository.update(id, data);
    
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_updated',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: `Vendor ${vendor.name} was updated`
      }
    });
    
    return vendor;
  }

  static async delete(id: string, adminId: string) {
    const vendor = await VendorRepository.findById(id);
    if (!vendor) throw new Error('Vendor not found');

    await VendorRepository.update(id, { status: 'INACTIVE' });
    if (vendor.user) {
      await prisma.user.update({ where: { id: vendor.userId }, data: { isActive: false } });
    }

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        eventType: 'vendor_deactivated',
        entityType: 'Vendor',
        entityId: vendor.id,
        message: `Vendor ${vendor.name} was deactivated`
      }
    });
  }

  static async getPerformance(id: string) {
    return await VendorRepository.getPerformanceMetrics(id);
  }

  static async getRfqs(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorRfqs(id, (page - 1) * perPage, perPage);
  }

  static async getQuotations(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorQuotations(id, (page - 1) * perPage, perPage);
  }

  static async getPos(id: string, page: number, perPage: number) {
    return await VendorRepository.findVendorPos(id, (page - 1) * perPage, perPage);
  }
}
