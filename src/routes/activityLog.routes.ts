import { Router } from 'express';
import { ActivityLogController } from '../controllers/activityLog.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER), ActivityLogController.getAll);
router.get('/event-types', roleGuard(ROLES.ADMIN, ROLES.MANAGER), ActivityLogController.getEventTypes);

export default router;
