import { Router } from 'express';
import { getAll } from '../controllers/log.controller.ts';
import { verifyToken, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', verifyToken, requireRole('ADMIN', 'MANAGER'), getAll);

export default router;
