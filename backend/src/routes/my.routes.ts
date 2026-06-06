import { Router } from 'express';
import { MyController } from '../controllers/my.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard(ROLES.VENDOR));

router.get('/rfqs', MyController.getRfqs);
router.get('/quotations', MyController.getQuotations);
router.get('/purchase-orders', MyController.getPurchaseOrders);
router.get('/invoices', MyController.getInvoices);

export default router;
