import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/permissions.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.getAll);
router.post('/generate', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.generate);

router.get('/:id', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), InvoiceController.getById);
router.patch('/:id/mark-paid', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.markPaid);
router.get('/:id/pdf', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR), InvoiceController.getPdf);
router.post('/:id/send-email', roleGuard(ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER), InvoiceController.sendEmail);

export default router;
