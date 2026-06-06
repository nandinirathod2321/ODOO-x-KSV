import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const files = {
  // Validators
  'validators/rfq.validator.ts': `import { z } from 'zod';

export const createRFQSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().refine(val => new Date(val) > new Date(), { message: 'Deadline must be in the future' }),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    notes: z.string().optional()
  })).min(1),
  vendorIds: z.array(z.string().uuid()).min(1)
});

export const updateRFQSchema = createRFQSchema.partial().extend({
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    notes: z.string().optional()
  })).optional()
});

export const publishRFQSchema = z.object({});
`,

  'validators/quotation.validator.ts': `import { z } from 'zod';

export const submitQuotationSchema = z.object({
  rfqId: z.string().uuid(),
  deliveryDays: z.number().min(1),
  validityDate: z.string().refine(val => new Date(val) > new Date(), { message: 'Validity date must be in the future' }),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    rfqItemId: z.string().uuid(),
    description: z.string(),
    quantity: z.number().min(1),
    unit: z.string(),
    unitPrice: z.number().min(0),
    taxPercent: z.number().min(0).default(0)
  })).min(1)
});

export const updateQuotationSchema = submitQuotationSchema.partial().omit({ rfqId: true });

export const selectWinnerSchema = z.object({});
`,

  // Repositories
  'repositories/rfq.repository.ts': `import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class RFQRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.RFQWhereInput;
    orderBy: Prisma.RFQOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.rFQ.count({ where: params.where }),
      prisma.rFQ.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true, vendors: true, quotations: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        vendors: {
          include: {
            vendor: { select: { id: true, name: true, status: true, rating: true, category: true } }
          }
        },
        quotations: {
          select: { id: true, vendor: { select: { name: true } }, status: true, totalAmount: true }
        }
      }
    });
  }

  static async create(data: Prisma.RFQCreateInput) {
    return prisma.rFQ.create({ data, include: { items: true, vendors: true } });
  }

  static async update(id: string, data: Prisma.RFQUpdateInput) {
    return prisma.rFQ.update({ where: { id }, data, include: { items: true, vendors: true } });
  }

  static async delete(id: string) {
    return prisma.rFQ.delete({ where: { id } });
  }
}
`,

  'repositories/quotation.repository.ts': `import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class QuotationRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.QuotationWhereInput;
    orderBy: Prisma.QuotationOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.quotation.count({ where: params.where }),
      prisma.quotation.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          vendor: { select: { name: true, rating: true } },
          rfq: { select: { title: true, rfqNumber: true, deadline: true } }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: { select: { name: true, email: true, gstNumber: true, contactPerson: true, rating: true } },
        rfq: { select: { title: true, rfqNumber: true } }
      }
    });
  }

  static async findByRfqAndVendor(rfqId: string, vendorId: string) {
    return prisma.quotation.findFirst({ where: { rfqId, vendorId } });
  }

  static async create(data: Prisma.QuotationCreateInput) {
    return prisma.quotation.create({ data, include: { items: true } });
  }

  static async update(id: string, data: Prisma.QuotationUpdateInput) {
    return prisma.quotation.update({ where: { id }, data, include: { items: true } });
  }

  static async findAllByRfqForCompare(rfqId: string) {
    return prisma.quotation.findMany({
      where: { rfqId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      include: { vendor: true, items: true }
    });
  }
}
`,

  // Services
  'services/rfq.service.ts': `import { RFQRepository } from '../repositories/rfq.repository.js';
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
          message: \`RFQ \${rfqNumber} was created\`
        }
      });

      for (const v of data.vendorIds) {
        const vendor = await tx.vendor.findUnique({ where: { id: v } });
        if (vendor && vendor.userId) {
          await tx.notification.create({
            data: {
              userId: vendor.userId,
              title: 'New RFQ Created',
              message: \`You have been assigned to RFQ \${rfqNumber} (Draft).\`,
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
          message: \`RFQ \${rfq.rfqNumber} was updated\`
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
          message: \`RFQ \${rfq.rfqNumber} was published\`
        }
      });

      const assignedVendors = await tx.rFQVendor.findMany({ where: { rfqId: id }, include: { vendor: true } });
      
      for (const rv of assignedVendors) {
        if (rv.vendor.userId) {
          await tx.notification.create({
            data: {
              userId: rv.vendor.userId,
              title: 'New RFQ Available',
              message: \`RFQ \${rfq.rfqNumber} has been published and is awaiting your quotation.\`,
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
        message: \`RFQ \${rfq.rfqNumber} was closed\`
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
`,

  'services/quotation.service.ts': `import { QuotationRepository } from '../repositories/quotation.repository.js';
import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { generateQuotationNumber } from '../utils/numberGenerator.js';

export class QuotationService {
  static async getAll(query: any) {
    const page = parseInt(query.page || '1');
    const perPage = parseInt(query.perPage || '10');
    const skip = (page - 1) * perPage;

    const where: Prisma.QuotationWhereInput = {};
    if (query.rfqId) where.rfqId = query.rfqId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.status) where.status = query.status;

    let orderBy: any = { submittedAt: 'desc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortDir === 'asc' ? 'asc' : 'desc' };
    }

    const [total, data] = await QuotationRepository.findMany({ skip, take: perPage, where, orderBy });
    return { data, meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  static async getById(id: string) {
    const quotation = await QuotationRepository.findById(id);
    if (!quotation) throw new Error('Quotation not found');
    return quotation;
  }

  static async submit(data: any, userId: string, io: any) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new Error('Vendor profile not found');

    const rfqVendor = await prisma.rFQVendor.findUnique({ where: { rfqId_vendorId: { rfqId: data.rfqId, vendorId: vendor.id } } });
    if (!rfqVendor) throw new Error('You are not invited to this RFQ');

    const rfq = await prisma.rFQ.findUnique({ where: { id: data.rfqId } });
    if (!rfq || rfq.status !== 'PUBLISHED') throw new Error('RFQ is not PUBLISHED');
    if (new Date() > rfq.deadline) throw new Error('RFQ deadline has passed');

    const existing = await QuotationRepository.findByRfqAndVendor(data.rfqId, vendor.id);
    if (existing) throw new Error('You have already submitted a quotation for this RFQ');

    const quotationNumber = await generateQuotationNumber();

    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsData = data.items.map((i: any) => {
        const lineTotal = i.quantity * i.unitPrice * (1 + i.taxPercent / 100);
        totalAmount += lineTotal;
        return {
          rfqItemId: i.rfqItemId,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          taxPercent: i.taxPercent,
          lineTotal
        };
      });

      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          rfqId: data.rfqId,
          vendorId: vendor.id,
          deliveryDays: data.deliveryDays,
          validityDate: new Date(data.validityDate),
          paymentTerms: data.paymentTerms,
          notes: data.notes,
          totalAmount,
          status: 'SUBMITTED',
          items: { create: itemsData }
        },
        include: { items: true }
      });

      const existingQuotationsCount = await tx.quotation.count({ where: { rfqId: data.rfqId } });
      if (existingQuotationsCount === 1) { // First quotation
        await tx.rFQ.update({ where: { id: data.rfqId }, data: { status: 'QUOTATION_RECEIVED' } });
      }

      await tx.activityLog.create({
        data: {
          userId,
          eventType: 'quotation_submitted',
          entityType: 'Quotation',
          entityId: quotation.id,
          message: \`Quotation \${quotationNumber} submitted for RFQ \${rfq.rfqNumber}\`
        }
      });

      // Notify Procurement
      const procurementUsers = await tx.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] } } });
      for (const u of procurementUsers) {
        await tx.notification.create({
          data: {
            userId: u.id,
            title: 'New Quotation Received',
            message: \`Vendor \${vendor.name} submitted a quotation for RFQ \${rfq.rfqNumber}\`,
            type: 'quotation_received',
            referenceType: 'Quotation',
            referenceId: quotation.id
          }
        });
      }

      if (io) io.emit('quotation_submitted', { rfqId: data.rfqId, quotationId: quotation.id });

      return quotation;
    });
  }

  static async update(id: string, data: any, userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new Error('Vendor profile not found');

    const quotation = await QuotationRepository.findById(id);
    if (!quotation) throw new Error('Quotation not found');
    if (quotation.vendorId !== vendor.id) throw new Error('Unauthorized');
    if (!['DRAFT', 'SUBMITTED'].includes(quotation.status)) throw new Error('Cannot update at this stage');

    const rfq = await prisma.rFQ.findUnique({ where: { id: quotation.rfqId } });
    if (rfq && new Date() > rfq.deadline) throw new Error('RFQ deadline has passed');

    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      
      if (data.items) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        const itemsData = data.items.map((i: any) => {
          const lineTotal = i.quantity * i.unitPrice * (1 + i.taxPercent / 100);
          totalAmount += lineTotal;
          return {
            quotationId: id,
            rfqItemId: i.rfqItemId,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            taxPercent: i.taxPercent,
            lineTotal
          };
        });
        await tx.quotationItem.createMany({ data: itemsData });
      } else {
        totalAmount = quotation.totalAmount; // Assume unchanged if items not provided
      }

      const updated = await tx.quotation.update({
        where: { id },
        data: {
          deliveryDays: data.deliveryDays,
          validityDate: data.validityDate ? new Date(data.validityDate) : undefined,
          paymentTerms: data.paymentTerms,
          notes: data.notes,
          totalAmount
        }
      });

      await tx.activityLog.create({
        data: {
          userId,
          eventType: 'quotation_updated',
          entityType: 'Quotation',
          entityId: id,
          message: \`Quotation \${quotation.quotationNumber} was updated\`
        }
      });

      return updated;
    });
  }

  static async compare(rfqId: string, adminId: string) {
    const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error('RFQ not found');

    const quotations = await QuotationRepository.findAllByRfqForCompare(rfqId);
    if (!quotations.length) return { rfq, quotations: [], lowestTotal: 0, recommendedVendor: null, ranking: [] };

    const lowestTotal = Math.min(...quotations.map(q => q.totalAmount));
    const fastestDelivery = Math.min(...quotations.map(q => q.deliveryDays));
    const maxRating = Math.max(...quotations.map(q => q.vendor.rating), 1);

    const ranking = quotations.map(q => {
      const priceScore = lowestTotal / q.totalAmount * 40;
      const deliveryScore = fastestDelivery / q.deliveryDays * 30;
      const ratingScore = (q.vendor.rating / maxRating) * 30;
      const totalScore = priceScore + deliveryScore + ratingScore;
      
      return {
        quotationId: q.id,
        vendorId: q.vendor.id,
        vendorName: q.vendor.name,
        totalAmount: q.totalAmount,
        deliveryDays: q.deliveryDays,
        rating: q.vendor.rating,
        score: parseFloat(totalScore.toFixed(2))
      };
    }).sort((a, b) => b.score - a.score);

    const recommendedVendor = ranking[0];

    await prisma.quotationComparisonSnapshot.create({
      data: {
        rfqId,
        generatedBy: adminId,
        recommendedVendorId: recommendedVendor.vendorId,
        comparisonScoreJson: ranking as any
      }
    });

    return {
      rfq,
      quotations,
      lowestTotal,
      recommendedVendor,
      ranking
    };
  }

  static async selectWinner(id: string, adminId: string, io: any) {
    const quotation = await QuotationRepository.findById(id);
    if (!quotation) throw new Error('Quotation not found');

    return await prisma.$transaction(async (tx) => {
      await tx.quotation.updateMany({
        where: { rfqId: quotation.rfqId },
        data: { status: 'REJECTED', isWinner: false }
      });

      const winner = await tx.quotation.update({
        where: { id },
        data: { status: 'SELECTED', isWinner: true }
      });

      await tx.rFQ.update({ where: { id: quotation.rfqId }, data: { status: 'AWARDED' } });

      const approval = await tx.approval.create({
        data: {
          quotationId: id,
          requestedBy: adminId,
          status: 'PENDING'
        }
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          eventType: 'winner_selected',
          entityType: 'Quotation',
          entityId: id,
          message: \`Quotation \${quotation.quotationNumber} selected as winner for RFQ\`
        }
      });

      const managers = await tx.user.findMany({ where: { role: 'MANAGER' } });
      for (const m of managers) {
        await tx.notification.create({
          data: {
            userId: m.id,
            title: 'Approval Required',
            message: \`A winning quotation (\${quotation.quotationNumber}) requires your approval.\`,
            type: 'approval_required',
            referenceType: 'Approval',
            referenceId: approval.id
          }
        });
      }

      if (io) io.emit('approval_required', { approvalId: approval.id });

      return { quotation: winner, approval };
    });
  }
}
`,

  // Controllers
  'controllers/rfq.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { RFQService } from '../services/rfq.service.js';
import { createRFQSchema, updateRFQSchema } from '../validators/rfq.validator.js';

export class RFQController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getAll(req.query, req.user!.role, req.user!.id);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.getById(req.params.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRFQSchema.parse(req.body);
      const result = await RFQService.create(data, req.user!.id);
      res.status(201).json({ message: 'RFQ created', data: result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRFQSchema.parse(req.body);
      const result = await RFQService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'RFQ updated', data: result });
    } catch (e) { next(e); }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await RFQService.publish(req.params.id, req.user!.id, io);
      res.json({ message: 'RFQ published', data: result });
    } catch (e) { next(e); }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RFQService.close(req.params.id, req.user!.id);
      res.json({ message: 'RFQ closed', data: result });
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RFQService.delete(req.params.id);
      res.json({ message: 'RFQ deleted' });
    } catch (e) { next(e); }
  }
}
`,

  'controllers/quotation.controller.ts': `import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service.js';
import { submitQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator.js';

export class QuotationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.getAll(req.query);
      res.json(result);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.getById(req.params.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitQuotationSchema.parse(req.body);
      const io = req.app.get('io');
      const result = await QuotationService.submit(data, req.user!.id, io);
      res.status(201).json({ message: 'Quotation submitted', data: result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateQuotationSchema.parse(req.body);
      const result = await QuotationService.update(req.params.id, data, req.user!.id);
      res.json({ message: 'Quotation updated', data: result });
    } catch (e) { next(e); }
  }

  static async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotationService.compare(req.params.rfqId, req.user!.id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async selectWinner(req: Request, res: Response, next: NextFunction) {
    try {
      const io = req.app.get('io');
      const result = await QuotationService.selectWinner(req.params.id, req.user!.id, io);
      res.json({ message: 'Quotation selected and approval created', data: result });
    } catch (e) { next(e); }
  }
}
`,

  // Routes
  'routes/rfq.routes.ts': `import { Router } from 'express';
import { RFQController } from '../controllers/rfq.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), RFQController.getAll);
router.get('/:id', RFQController.getById);

router.post('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.create);
router.patch('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.update);
router.patch('/:id/publish', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.publish);
router.patch('/:id/close', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.close);
router.delete('/:id', roleGuard(ROLES.ADMIN), RFQController.delete);

export default router;
`,

  'routes/quotation.routes.ts': `import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), QuotationController.getAll);
router.get('/compare/:rfqId', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), QuotationController.compare);
router.get('/:id', QuotationController.getById);

router.post('/', roleGuard(ROLES.VENDOR), QuotationController.submit);
router.patch('/:id', roleGuard(ROLES.VENDOR), QuotationController.update);

router.patch('/:id/select-winner', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), QuotationController.selectWinner);

export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, filepath), content);
}

// Register Routes & setup socket.io on Express app
const serverPath = path.join(srcDir, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('rfqRoutes')) {
  const imports = `import rfqRoutes from './routes/rfq.routes.js';\nimport quotationRoutes from './routes/quotation.routes.js';\n`;
  serverContent = serverContent.replace(/import vendorRoutes/, imports + 'import vendorRoutes');
  
  const middlewareReg = `app.use('/api/rfqs', rfqRoutes);\napp.use('/api/quotations', quotationRoutes);\n`;
  serverContent = serverContent.replace("app.use('/api/my', myRoutes);", `app.use('/api/my', myRoutes);\n${middlewareReg}`);
  
  // Expose socket.io to req
  if (!serverContent.includes("app.set('io'")) {
    serverContent = serverContent.replace('app.use(express.json());', `app.use(express.json());\napp.set('io', io);`);
  }

  fs.writeFileSync(serverPath, serverContent);
}

console.log('RFQ and Quotation modules scaffolded successfully.');
