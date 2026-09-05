const paymentService = require('../services/payment.service');
const auditService = require('../services/audit.service');

const createPayment = async (req, res, next) => {
  try {
    const pay = await paymentService.createPayment(req.user.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Payment', entityId: pay.id, action: 'PAYMENT_CREATE', newValues: pay });
    res.status(201).json({ success: true, message: 'Payment created', data: pay });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const allocatePayment = async (req, res, next) => {
  try {
    const alloc = await paymentService.allocatePayment(req.user.id, req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'PaymentAllocation', entityId: alloc.id, action: 'PAYMENT_ALLOCATE', newValues: alloc });
    res.status(201).json({ success: true, message: 'Payment allocated', data: alloc });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createRazorpayOrder(req.user.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Payment', entityId: result.paymentId, action: 'RAZORPAY_ORDER_CREATED', newValues: result });
    res.status(201).json({ success: true, message: 'Razorpay order created', data: result });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    if (error.message.startsWith('FAILED_DEPENDENCY')) return res.status(424).json({ success: false, message: error.message });
    next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyRazorpayPayment(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: result.alreadyProcessed ? 'Payment already processed' : 'Payment verified successfully',
      data: result
    });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).json({ success: false, message: error.message });
    next(error);
  }
};

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
    }

    // req.body is the raw Buffer (set by express.raw middleware on this route)
    const result = await paymentService.handleRazorpayWebhook(req.body, signature);
    // Always respond 200 to Razorpay so it stops retrying (even for unhandled events)
    res.status(200).json({ success: true, message: 'Webhook received', data: result });
  } catch (error) {
    if (error.message.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ success: false, message: 'Webhook signature verification failed' });
    }
    if (error.message.startsWith('BAD_REQUEST')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    // For internal errors still return 200 so Razorpay doesn't retry unnecessarily
    console.error('[Webhook Error]', error.message);
    res.status(200).json({ success: false, message: 'Webhook processing error' });
  }
};

module.exports = { createPayment, allocatePayment, createRazorpayOrder, verifyRazorpayPayment, handleRazorpayWebhook };
