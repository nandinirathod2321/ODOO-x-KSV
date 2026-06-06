import { Router } from 'express';
import { POController } from '../controllers/po.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), POController.getAll);
router.get('/:id', POController.getOne);

export default router;
