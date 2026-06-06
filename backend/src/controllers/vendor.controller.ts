import prisma from '../lib/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const vendors = await prisma.vendor.findMany({ where });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.create({ data: req.body });
    res.status(201).json(vendor);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(vendor);
  } catch (err) {
    next(err);
  }
};
