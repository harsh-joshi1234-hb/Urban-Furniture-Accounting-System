const productService = require('../services/product.service');
const auditService = require('../services/audit.service');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Product',
      entityId: product.id,
      action: 'PRODUCT_CREATE',
      newValues: product
    });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getProducts(req.query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const oldProduct = await productService.getProductById(req.params.id);
    if (!oldProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = await productService.updateProduct(req.params.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Product',
      entityId: product.id,
      action: 'PRODUCT_UPDATE',
      oldValues: oldProduct,
      newValues: product
    });
    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Product',
      entityId: product.id,
      action: 'PRODUCT_DELETE',
      oldValues: product
    });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    if (error.message.startsWith('CONFLICT')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
