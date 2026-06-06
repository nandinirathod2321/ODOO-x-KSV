import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { roleGuard } from '../middlewares/role.middleware.ts';
import { ROLES } from '../constants/permissions.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), QuotationController.getAll);
router.get('/compare/:rfqId', roleGuard(ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER), QuotationController.compare);
router.get('/:id', QuotationController.getById);

router.post('/', roleGuard(ROLES.VENDOR), QuotationController.submit);
router.patch('/:id', roleGuard(ROLES.VENDOR), QuotationController.update);

router.patch('/:id/select-winner', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), QuotationController.selectWinner);

export default router;
