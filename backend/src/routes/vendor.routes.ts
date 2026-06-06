import { Router } from 'express';
import { getAll, getOne, create, update } from '../controllers/vendor.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getOne);
router.post('/', verifyToken, requireRole('ADMIN', 'PROCUREMENT_OFFICER'), create);
router.patch('/:id', verifyToken, requireRole('ADMIN'), update);

export default router;
