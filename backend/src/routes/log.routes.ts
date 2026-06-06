import { Router } from 'express';
import { getAll } from '../controllers/log.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requireRole('ADMIN', 'MANAGER'), getAll);

export default router;
