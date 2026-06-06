import { Router } from 'express';
import { getAll, getOne, create, updateStatus } from '../controllers/rfq.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getOne);
router.post('/', verifyToken, requireRole('PROCUREMENT_OFFICER'), create);
router.patch('/:id/status', verifyToken, requireRole('PROCUREMENT_OFFICER'), updateStatus);

export default router;
