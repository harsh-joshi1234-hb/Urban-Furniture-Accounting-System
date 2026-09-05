const express = require('express');
const router = express.Router();
const payController = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validatePayment, validateAllocation } = require('../validators/sales.validator');

router.use(requireAuth);

router.post('/', requirePermission('payment.create'), validatePayment, payController.createCustomerPayment);
router.post('/:id/allocations', requirePermission('payment.create'), validateAllocation, payController.allocatePayment);

module.exports = router;
