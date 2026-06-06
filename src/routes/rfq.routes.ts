import { Router } from 'express';
import { RFQController } from '../controllers/rfq.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), RFQController.getAll);
router.get('/:id', RFQController.getById);

router.post('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.create);
router.patch('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.update);
router.patch('/:id/publish', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.publish);
router.patch('/:id/close', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), RFQController.close);
router.delete('/:id', roleGuard(ROLES.ADMIN), RFQController.delete);

export default router;
