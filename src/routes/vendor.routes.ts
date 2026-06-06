import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getAll);
router.post('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), VendorController.create);

router.get('/:id', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getById);
router.patch('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), VendorController.update);
router.delete('/:id', roleGuard(ROLES.ADMIN), VendorController.delete);

router.get('/:id/performance', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getPerformance);
router.get('/:id/rfqs', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getRfqs);
router.get('/:id/quotations', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getQuotations);
router.get('/:id/purchase-orders', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), VendorController.getPos);

export default router;
