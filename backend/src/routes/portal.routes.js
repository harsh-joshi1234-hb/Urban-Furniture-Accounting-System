const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portal.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/invoices', portalController.getPortalInvoices);
router.get('/invoices/:id', portalController.getPortalInvoiceById);
router.post('/payments', portalController.initiatePortalPayment);

module.exports = router;
