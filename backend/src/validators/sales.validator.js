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
  const { partnerId, amount, paymentDate, paymentMethod } = req.body;
  if (!partnerId) return res.status(400).json({ success: false, message: 'partnerId is required' });
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
  const { documentType, customerInvoiceId, allocatedAmount } = req.body;
  if (documentType !== 'CUSTOMER_INVOICE') {
    return res.status(400).json({ success: false, message: 'Only CUSTOMER_INVOICE allocation is supported in this phase' });
  }
  if (!customerInvoiceId) return res.status(400).json({ success: false, message: 'customerInvoiceId is required' });
  if (allocatedAmount === undefined || Number(allocatedAmount) <= 0) {
    return res.status(400).json({ success: false, message: 'Allocated amount must be greater than 0' });
  }
  next();
};

module.exports = {
  validateSalesOrder,
  validateCustomerInvoice,
  validatePayment,
  validateAllocation
};
