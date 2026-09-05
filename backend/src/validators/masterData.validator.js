const validateContact = (req, res, next) => {
  const { name, type, email } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Contact name is required' });
  }
  if (!['CUSTOMER', 'VENDOR'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Contact type must be CUSTOMER or VENDOR' });
  }
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
  }
  next();
};

const validateProductCategory = (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  next();
};

const validateProduct = (req, res, next) => {
  const { name, categoryId, productType, salesPrice, cost } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Product name is required' });
  if (!categoryId) return res.status(400).json({ success: false, message: 'Category ID is required' });
  if (!['GOODS', 'SERVICE', 'COMBO'].includes(productType)) {
    return res.status(400).json({ success: false, message: 'Invalid product type' });
  }
  if (salesPrice === undefined || isNaN(Number(salesPrice)) || Number(salesPrice) < 0) {
    return res.status(400).json({ success: false, message: 'Sales price must be a non-negative number' });
  }
  if (cost === undefined || isNaN(Number(cost)) || Number(cost) < 0) {
    return res.status(400).json({ success: false, message: 'Cost must be a non-negative number' });
  }
  next();
};

const validateAnalyticAccount = (req, res, next) => {
  const { name, type, startDate, endDate } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Account name is required' });
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be INCOME or EXPENSE' });
  }
  
  if (startDate && endDate) {
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'endDate cannot be before startDate' });
    }
  }
  next();
};

module.exports = {
  validateContact,
  validateProductCategory,
  validateProduct,
  validateAnalyticAccount
};
