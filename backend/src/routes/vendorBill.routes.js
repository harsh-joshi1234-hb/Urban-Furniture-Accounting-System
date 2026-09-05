const express = require('express');
const router = express.Router();
const billController = require('../controllers/vendorBill.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateVendorBill } = require('../validators/purchase.validator');

router.use(requireAuth);

router.get('/', requirePermission('bill.read'), billController.getBills);
router.get('/:id', requirePermission('bill.read'), billController.getBillById);
router.post('/', requirePermission('bill.create'), validateVendorBill, billController.createDirectBill);
router.patch('/:id', requirePermission('bill.create'), billController.updateBill);
router.post('/:id/confirm', requirePermission('bill.confirm'), billController.confirmBill);
router.post('/:id/cancel', requirePermission('bill.cancel'), billController.cancelBill);

// Special case: create bill from PO
router.post('/from-po/:id', requirePermission('bill.create'), billController.createBillFromPO);

module.exports = router;
