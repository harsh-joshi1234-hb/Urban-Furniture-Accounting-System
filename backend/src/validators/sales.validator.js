const validateSalesOrder = (req, res, next) => {
  const { customerId, orderDate, lines } = req.body;
  if (!customerId) return res.status(400).json({ success: false, message: 'customerId is required' });
  if (!orderDate) return res.status(400).json({ success: false, message: 'orderDate is required' });
  
  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one line is required' });
  }

  for (const line of lines) {
    if (!line.productId) return res.status(400).json({ success: false, message: 'Line productId is required' });
    if (line.quantity === undefined || Number(line.quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Line quantity must be greater than 0' });
    }
    if (line.unitPrice !== undefined && Number(line.unitPrice) < 0) {
      return res.status(400).json({ success: false, message: 'Line unitPrice cannot be negative' });
    }
  }

  next();
};

const validateCustomerInvoice = (req, res, next) => {
  const { customerId, invoiceDate, dueDate, lines } = req.body;
  if (!customerId) return res.status(400).json({ success: false, message: 'customerId is required' });
  if (!invoiceDate) return res.status(400).json({ success: false, message: 'invoiceDate is required' });
  if (!dueDate) return res.status(400).json({ success: false, message: 'dueDate is required' });

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one line is required' });
  }

  for (const line of lines) {
    if (!line.productId) return res.status(400).json({ success: false, message: 'Line productId is required' });
    if (!line.accountId) return res.status(400).json({ success: false, message: 'Line accountId is required' });
    if (line.quantity === undefined || Number(line.quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Line quantity must be greater than 0' });
    }
    if (line.unitPrice !== undefined && Number(line.unitPrice) < 0) {
      return res.status(400).json({ success: false, message: 'Line unitPrice cannot be negative' });
    }
  }

  next();
};

const validatePayment = (req, res, next) => {
  const { partnerId, paymentType, partnerType, amount, paymentDate, paymentMethod } = req.body;
  if (!partnerId) return res.status(400).json({ success: false, message: 'partnerId is required' });
  
  // New validation for paymentType and partnerType
  if (!['RECEIVE', 'SEND'].includes(paymentType)) {
    return res.status(400).json({ success: false, message: 'Invalid paymentType' });
  }
  if (!['CUSTOMER', 'VENDOR'].includes(partnerType)) {
    return res.status(400).json({ success: false, message: 'Invalid partnerType' });
  }
  if (paymentType === 'RECEIVE' && partnerType !== 'CUSTOMER') {
    return res.status(400).json({ success: false, message: 'RECEIVE must be for a CUSTOMER' });
  }
  if (paymentType === 'SEND' && partnerType !== 'VENDOR') {
    return res.status(400).json({ success: false, message: 'SEND must be for a VENDOR' });
  }

  if (amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  }
  if (!paymentDate) return res.status(400).json({ success: false, message: 'paymentDate is required' });
  if (!['BANK', 'CASH', 'ONLINE'].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  next();
};

const validateAllocation = (req, res, next) => {
  const { documentType, customerInvoiceId, vendorBillId, allocatedAmount } = req.body;
  if (!['CUSTOMER_INVOICE', 'VENDOR_BILL'].includes(documentType)) {
    return res.status(400).json({ success: false, message: 'Invalid documentType' });
  }
  if (documentType === 'CUSTOMER_INVOICE' && !customerInvoiceId) {
    return res.status(400).json({ success: false, message: 'customerInvoiceId is required for CUSTOMER_INVOICE' });
  }
  if (documentType === 'VENDOR_BILL' && !vendorBillId) {
    return res.status(400).json({ success: false, message: 'vendorBillId is required for VENDOR_BILL' });
  }
  if (allocatedAmount === undefined || Number(allocatedAmount) <= 0) {
    return res.status(400).json({ success: false, message: 'Allocated amount must be greater than 0' });
  }
  next();
};

const validateRazorpayOrderRequest = (req, res, next) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res.status(400).json({ success: false, message: 'invoiceId is required' });
  }
  next();
};

const validateRazorpayVerifyRequest = (req, res, next) => {
  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId is required' });
  if (!razorpayOrderId) return res.status(400).json({ success: false, message: 'razorpayOrderId is required' });
  if (!razorpayPaymentId) return res.status(400).json({ success: false, message: 'razorpayPaymentId is required' });
  if (!razorpaySignature) return res.status(400).json({ success: false, message: 'razorpaySignature is required' });
  next();
};

module.exports = {
  validateSalesOrder,
  validateCustomerInvoice,
  validatePayment,
  validateAllocation,
  validateRazorpayOrderRequest,
  validateRazorpayVerifyRequest
};
