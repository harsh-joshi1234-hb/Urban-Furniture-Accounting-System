const express = require('express');
const router = express.Router();
const payController = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validatePayment, validateAllocation } = require('../validators/sales.validator'); // Using the shared one we updated

router.use(requireAuth);

router.post('/', requirePermission('payment.create'), validatePayment, payController.createPayment);
router.post('/:id/allocations', requirePermission('payment.create'), validateAllocation, payController.allocatePayment);

module.exports = router;
