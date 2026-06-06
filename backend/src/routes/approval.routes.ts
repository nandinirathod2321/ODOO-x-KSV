import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER), ApprovalController.getAll);
router.get('/:id', roleGuard(ROLES.ADMIN, ROLES.MANAGER), ApprovalController.getOne);
router.patch('/:id/approve', roleGuard(ROLES.MANAGER), ApprovalController.approve);
router.patch('/:id/reject', roleGuard(ROLES.MANAGER), ApprovalController.reject);

export default router;
