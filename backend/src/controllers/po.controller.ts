import { Request, Response, NextFunction } from 'express';
import { POService } from '../services/po.service.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';
import prisma from '../config/prisma.js';

export class POController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // For VENDOR role, filter by their own vendor ID
      const queryWithUser = { ...req.query };
      if (req.user!.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.id } });
        if (vendor) {
          queryWithUser.vendorId = vendor.id;
        } else {
          // No vendor profile — return empty list
          return paginatedResponse(res, [], { total: 0, page: 1, per_page: 10, last_page: 0 }, 'OK');
        }
      }

      const result = await POService.getAll(queryWithUser);
      if (result.meta) {
        paginatedResponse(res, serializeData(result.data), {
          total: result.meta.total,
          page: result.meta.page,
          per_page: result.meta.perPage,
          last_page: result.meta.lastPage
        }, 'OK');
      } else {
        successResponse(res, serializeData(result), 'OK');
      }
    } catch (e) {
      next(e);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await POService.getById(req.params.id as string);
      
      // Enforce Vendor access
      if (req.user!.role === 'VENDOR' && result.vendor?.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      successResponse(res, serializeData(result), 'OK');
    } catch (e) {
      next(e);
    }
  }
}
