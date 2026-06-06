import { Router } from 'express';
import { getAll, getOne } from '../controllers/po.controller.ts';
import { verifyToken, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', verifyToken, requireRole('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), getAll);
router.get('/:id', verifyToken, getOne);

export default router;
