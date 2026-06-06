import prisma from '../lib/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'VENDOR') {
      const vendorUser = await prisma.vendor.findFirst({ where: { email: req.user.email } });
      if (!vendorUser) return res.json([]);
      where = { vendors: { some: { vendorId: vendorUser.id } } };
    }
    const rfqs = await prisma.rfq.findMany({ where });
    res.json(rfqs);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: req.params.id },
      include: {
        vendors: { include: { vendor: true } },
        _count: { select: { quotations: true } }
      }
    });
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    res.json(rfq);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { title, description, quantity, unit, deadline, vendorIds } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.rfq.count();
      const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
      
      const rfq = await tx.rfq.create({
        data: {
          rfqNumber,
          title,
          description,
          quantity,
          unit,
          deadline: new Date(deadline),
          status: 'OPEN',
          createdById: req.user.id
        }
      });

      if (vendorIds && vendorIds.length > 0) {
        await tx.rfqVendor.createMany({
          data: vendorIds.map(id => ({ rfqId: rfq.id, vendorId: id }))
        });
      }

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATED_RFQ',
          entityType: 'Rfq',
          entityId: rfq.id
        }
      });

      return rfq;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const rfq = await prisma.rfq.update({
      where: { id: req.params.id },
      data: { status }
    });
    
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `UPDATED_RFQ_STATUS_${status}`,
        entityType: 'Rfq',
        entityId: rfq.id
      }
    });

    res.json(rfq);
  } catch (err) {
    next(err);
  }
};
