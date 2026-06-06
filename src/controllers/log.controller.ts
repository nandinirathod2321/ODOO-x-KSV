import prisma from '../lib/prisma.ts';

export const getAll = async (req, res, next) => {
  try {
    const { entityType } = req.query;
    const where = entityType ? { entityType } : {};

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
