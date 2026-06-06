import prisma from '../lib/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: { select: { name: true } } }
    });
    res.json(pos);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        approval: {
          include: {
            quotation: {
              include: {
                rfq: true
              }
            }
          }
        }
      }
    });
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    res.json(po);
  } catch (err) {
    next(err);
  }
};
