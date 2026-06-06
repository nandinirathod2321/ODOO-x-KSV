import { Router } from 'express';
import { submit, compare } from '../controllers/quotation.controller.js';
// Auth middleware should be added here

const router = Router();

router.post('/', submit);
router.get('/rfq/:rfqId/compare', compare);

export default router;
