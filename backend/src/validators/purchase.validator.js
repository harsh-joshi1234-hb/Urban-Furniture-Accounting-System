const validatePurchaseOrder = (req, res, next) => {
  const { vendorId, orderDate, lines } = req.body;
  if (!vendorId) return res.status(400).json({ success: false, message: 'vendorId is required' });
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

const validateVendorBill = (req, res, next) => {
  const { vendorId, billDate, dueDate, lines } = req.body;
  if (!vendorId) return res.status(400).json({ success: false, message: 'vendorId is required' });
  if (!billDate) return res.status(400).json({ success: false, message: 'billDate is required' });
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

module.exports = {
  validatePurchaseOrder,
  validateVendorBill
};
