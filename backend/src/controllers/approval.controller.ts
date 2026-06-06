import prisma from '../lib/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const approvals = await prisma.approval.findMany({
      include: {
        quotation: { include: { rfq: true, vendor: true } },
        requestedBy: { select: { name: true } }
      }
    });
    res.json(approvals);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const approval = await prisma.approval.findUnique({
      where: { id: req.params.id },
      include: {
        quotation: { include: { rfq: true, vendor: true } },
        requestedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } }
      }
    });
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    res.json(approval);
  } catch (err) {
    next(err);
  }
};

export const approve = async (req, res, next) => {
  try {
    const approvalId = req.params.id;
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          reviewedById: req.user.id,
          reviewedAt: new Date()
        },
        include: { quotation: true }
      });

      const count = await tx.purchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
      const subtotal = Number(approval.quotation.totalPrice);
      const taxAmount = subtotal * 0.18;
      const total = subtotal + taxAmount;

      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          approvalId: approval.id,
          vendorId: approval.quotation.vendorId,
          subtotal,
          taxRate: 0.18,
          taxAmount,
          total,
          status: 'ISSUED'
        }
      });

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'APPROVED_QUOTATION',
          entityType: 'Approval',
          entityId: approval.id
        }
      });

      return po;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const reject = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const approval = await prisma.approval.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        remarks,
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'REJECTED_QUOTATION',
        entityType: 'Approval',
        entityId: approval.id
      }
    });

    res.json(approval);
  } catch (err) {
    next(err);
  }
};
