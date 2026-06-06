import { QuotationRepository } from '../repositories/quotation.repository.js';
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
          message: `Quotation ${quotationNumber} submitted for RFQ ${rfq.rfqNumber}`
        }
      });

      // Notify Procurement
      const procurementUsers = await tx.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] } } });
      for (const u of procurementUsers) {
        await tx.notification.create({
          data: {
            userId: u.id,
            title: 'New Quotation Received',
            message: `Vendor ${vendor.name} submitted a quotation for RFQ ${rfq.rfqNumber}`,
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
          message: `Quotation ${quotation.quotationNumber} was updated`
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
          message: `Quotation ${quotation.quotationNumber} selected as winner for RFQ`
        }
      });

      const managers = await tx.user.findMany({ where: { role: 'MANAGER' } });
      for (const m of managers) {
        await tx.notification.create({
          data: {
            userId: m.id,
            title: 'Approval Required',
            message: `A winning quotation (${quotation.quotationNumber}) requires your approval.`,
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
