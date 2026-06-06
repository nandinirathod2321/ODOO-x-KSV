import { Router } from 'express';
import { getAll, getOne, approve, reject } from '../controllers/approval.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requireRole('MANAGER', 'ADMIN'), getAll);
router.get('/:id', verifyToken, requireRole('MANAGER', 'ADMIN'), getOne);
router.patch('/:id/approve', verifyToken, requireRole('MANAGER'), approve);
router.patch('/:id/reject', verifyToken, requireRole('MANAGER'), reject);

export default router;
