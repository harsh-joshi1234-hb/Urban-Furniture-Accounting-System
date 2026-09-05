const express = require('express');
const router = express.Router();
const invController = require('../controllers/invoice.controller');
const soController = require('../controllers/invoice.controller'); // Wait, createInvoiceFromSO is in invController
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateCustomerInvoice } = require('../validators/sales.validator');

router.use(requireAuth);

router.get('/', requirePermission('invoice.read'), invController.getInvoices);
router.get('/:id', requirePermission('invoice.read'), invController.getInvoiceById);
router.post('/', requirePermission('invoice.create'), validateCustomerInvoice, invController.createDirectInvoice);
router.patch('/:id', requirePermission('invoice.create'), invController.updateInvoice); // DRAFT update
router.post('/:id/confirm', requirePermission('invoice.confirm'), invController.confirmInvoice);
router.post('/:id/cancel', requirePermission('invoice.cancel'), invController.cancelInvoice);

// Special case: create invoice from SO
router.post('/from-so/:id', requirePermission('invoice.create'), invController.createInvoiceFromSO);

module.exports = router;
