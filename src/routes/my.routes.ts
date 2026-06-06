import { Router } from 'express';
import { MyController } from '../controllers/my.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard(ROLES.VENDOR));

router.get('/rfqs', MyController.getRfqs);
router.get('/quotations', MyController.getQuotations);
router.get('/purchase-orders', MyController.getPurchaseOrders);
router.get('/invoices', MyController.getInvoices);

export default router;
