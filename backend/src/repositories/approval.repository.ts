import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { generatePONumber } from '../utils/numberGenerator.js';

export class ApprovalRepository {
  static async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.ApprovalWhereInput;
    orderBy: Prisma.ApprovalOrderByWithRelationInput;
  }) {
    return prisma.$transaction([
      prisma.approval.count({ where: params.where }),
      prisma.approval.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          quotation: {
            include: {
              vendor: { select: { id: true, name: true, email: true } },
              rfq: { select: { id: true, title: true, rfqNumber: true } }
            }
          }
        }
      })
    ]);
  }

  static async findById(id: string) {
    return prisma.approval.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: true,
            items: true
          }
        },
        purchaseOrders: true
      }
    });
  }

  static async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', approverId: string, remarks?: string) {
    return prisma.$transaction(async (tx) => {
      const approval = await tx.approval.findUnique({
        where: { id },
        include: {
          quotation: {
            include: {
              vendor: true,
              rfq: true,
              items: true
            }
          }
        }
      });

      if (!approval) throw new Error('Approval request not found');
      if (approval.status !== 'PENDING') throw new Error('Approval is already processed');

      const updatedApproval = await tx.approval.update({
        where: { id },
        data: {
          status,
          approvedBy: approverId,
          remarks,
          actionedAt: new Date()
        }
      });

      if (status === 'APPROVED') {
        const poNumber = await generatePONumber();
        const deliveryDeadline = new Date();
        deliveryDeadline.setDate(deliveryDeadline.getDate() + approval.quotation.deliveryDays);

        const po = await tx.purchaseOrder.create({
          data: {
            poNumber,
            rfqId: approval.quotation.rfqId,
            quotationId: approval.quotation.id,
            vendorId: approval.quotation.vendorId,
            approvalId: id,
            totalAmount: approval.quotation.totalAmount,
            deliveryDeadline,
            termsAndConditions: approval.quotation.paymentTerms || '',
            status: 'ISSUED',
            createdBy: approval.quotation.rfq.createdBy,
            items: {
              create: approval.quotation.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                taxPercent: item.taxPercent,
                lineTotal: item.lineTotal
              }))
            }
          },
          include: {
            items: true,
            vendor: true
          }
        });

        // Update quotation status
        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: { status: 'ACCEPTED' }
        });

        // Create Activity Log
        await tx.activityLog.create({
          data: {
            userId: approverId,
            eventType: 'po_generated',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            message: `Purchase Order ${poNumber} generated automatically upon approval`
          }
        });

        // Notify Vendor
        if (approval.quotation.vendor.userId) {
          await tx.notification.create({
            data: {
              userId: approval.quotation.vendor.userId,
              title: 'Purchase Order Issued',
              message: `Purchase Order ${poNumber} has been issued for your quotation.`,
              type: 'po_issued',
              referenceType: 'PurchaseOrder',
              referenceId: po.id
            }
          });
        }
      } else {
        // If rejected, set quotation status back to REJECTED
        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: { status: 'REJECTED' }
        });

        // Update RFQ status back to QUOTATION_RECEIVED
        await tx.rFQ.update({
          where: { id: approval.quotation.rfqId },
          data: { status: 'QUOTATION_RECEIVED' }
        });
      }

      return updatedApproval;
    });
  }
}
