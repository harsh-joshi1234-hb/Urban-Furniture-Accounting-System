const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/productCategory.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateProductCategory } = require('../validators/masterData.validator');

router.use(requireAuth);

// Wait, the prompt didn't explicitly say "productCategory.read", it just said "ADMIN: create/read/update/delete".
// I'll map this to product.read or productCategory.read. In my seed script, I used product.create.
// Actually, in the seed script I didn't create productCategory permissions. 
// Ah, the PRD said "Product Categories: ADMIN: create/read/update/delete". Let me map it to product.* for simplicity or just allow if they have product.*
// Actually, let's just use product.* permissions for categories too, or I can add category permissions. 
// The prompt said: "product.create, product.read, product.update, product.delete". I'll use these.

router.get('/', requirePermission('product.read'), categoryController.getCategories);
router.get('/:id', requirePermission('product.read'), categoryController.getCategoryById);
router.post('/', requirePermission('product.create'), validateProductCategory, categoryController.createCategory);
router.patch('/:id', requirePermission('product.update'), categoryController.updateCategory);
router.delete('/:id', requirePermission('product.delete'), categoryController.deleteCategory);

module.exports = router;
