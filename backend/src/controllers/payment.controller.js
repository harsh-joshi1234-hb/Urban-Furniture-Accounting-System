const paymentService = require('../services/payment.service');
const auditService = require('../services/audit.service');

const createCustomerPayment = async (req, res, next) => {
  try {
    const pay = await paymentService.createCustomerPayment(req.user.id, req.body);
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

module.exports = { createCustomerPayment, allocatePayment };
