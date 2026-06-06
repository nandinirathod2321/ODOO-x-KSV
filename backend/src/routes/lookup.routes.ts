import { Router } from 'express';
import { LookupController } from '../controllers/lookup.controller.js';

const router = Router();

router.get('/vendor-categories', LookupController.getVendorCategories);
router.get('/vendor-statuses', LookupController.getVendorStatuses);
router.get('/rfq-statuses', LookupController.getRfqStatuses);
router.get('/quotation-statuses', LookupController.getQuotationStatuses);
router.get('/po-statuses', LookupController.getPoStatuses);
router.get('/invoice-statuses', LookupController.getInvoiceStatuses);
router.get('/roles', LookupController.getRoles);
router.get('/units', LookupController.getUnits);
router.get('/activity-event-types', LookupController.getActivityEventTypes);

export default router;
