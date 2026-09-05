const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateProduct } = require('../validators/masterData.validator');

router.use(requireAuth);

router.get('/', requirePermission('product.read'), productController.getProducts);
router.get('/:id', requirePermission('product.read'), productController.getProductById);
router.post('/', requirePermission('product.create'), validateProduct, productController.createProduct);
router.patch('/:id', requirePermission('product.update'), productController.updateProduct);
router.delete('/:id', requirePermission('product.delete'), productController.deleteProduct);

module.exports = router;
