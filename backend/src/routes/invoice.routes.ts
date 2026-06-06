import { Router } from 'express';
import { getAll, getOne, generate, getPdf, sendEmail } from '../controllers/invoice.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getOne);
router.post('/', verifyToken, requireRole('PROCUREMENT_OFFICER'), generate);
router.get('/:id/pdf', verifyToken, getPdf);
router.post('/:id/send-email', verifyToken, requireRole('PROCUREMENT_OFFICER'), sendEmail);

export default router;
