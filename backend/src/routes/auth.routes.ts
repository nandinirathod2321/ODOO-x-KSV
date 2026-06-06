import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

export default router;
