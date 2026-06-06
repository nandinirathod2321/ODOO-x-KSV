import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard(ROLES.ADMIN, ROLES.MANAGER));

router.get('/vendor-performance', ReportsController.getVendorPerformance);
router.get('/spending-summary', ReportsController.getSpendingSummary);
router.get('/monthly-trends', ReportsController.getMonthlyTrends);
router.get('/procurement-stats', ReportsController.getProcurementStats);
router.get('/export', ReportsController.exportReport);

export default router;
