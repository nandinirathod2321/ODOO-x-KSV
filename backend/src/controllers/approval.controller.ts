import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { serializeData } from '../utils/serializer.js';

export class ApprovalController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.getAll(req.query);
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
      const result = await ApprovalService.getById(req.params.id as string);
      successResponse(res, serializeData(result), 'OK');
    } catch (e) {
      next(e);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.approve(req.params.id as string, req.user!.id, req.body.remarks);
      successResponse(res, serializeData(result), 'Approved');
    } catch (e) {
      next(e);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.reject(req.params.id as string, req.user!.id, req.body.remarks);
      successResponse(res, serializeData(result), 'Rejected');
    } catch (e) {
      next(e);
    }
  }
}
