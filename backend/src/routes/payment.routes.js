const express = require('express');
const router = express.Router();
const payController = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const {
  validatePayment,
  validateAllocation,
  validateRazorpayOrderRequest,
  validateRazorpayVerifyRequest
} = require('../validators/sales.validator');

// All payment routes require authentication
router.use(requireAuth);

// Internal staff payment routes
router.get('/', requirePermission('payment.read'), payController.getPayments);
router.post('/', requirePermission('payment.create'), validatePayment, payController.createPayment);
router.post('/:id/allocations', requirePermission('payment.create'), validateAllocation, payController.allocatePayment);

// Customer portal Razorpay routes (authentication only, no staff permission required)
router.post('/razorpay/order', validateRazorpayOrderRequest, payController.createRazorpayOrder);
router.post('/razorpay/verify', validateRazorpayVerifyRequest, payController.verifyRazorpayPayment);

module.exports = router;
