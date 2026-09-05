const express = require('express');
const router = express.Router();
const payController = require('../controllers/payment.controller');

// NO JWT auth middleware here — webhook uses Razorpay signature verification instead
router.post('/', payController.handleRazorpayWebhook);

module.exports = router;
