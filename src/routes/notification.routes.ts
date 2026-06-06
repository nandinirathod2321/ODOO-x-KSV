import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.use(authMiddleware);

router.get('/', NotificationController.getAll);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markRead);

export default router;
