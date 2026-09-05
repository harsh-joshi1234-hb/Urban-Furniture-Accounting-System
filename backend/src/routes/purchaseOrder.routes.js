const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validatePurchaseOrder } = require('../validators/purchase.validator');

router.use(requireAuth);

router.get('/', requirePermission('purchase_order.read'), poController.getPOs);
router.get('/:id', requirePermission('purchase_order.read'), poController.getPOById);
router.post('/', requirePermission('purchase_order.create'), validatePurchaseOrder, poController.createPO);
router.patch('/:id', requirePermission('purchase_order.update'), poController.updatePO);
router.post('/:id/confirm', requirePermission('purchase_order.confirm'), poController.confirmPO);
router.post('/:id/cancel', requirePermission('purchase_order.cancel'), poController.cancelPO);

module.exports = router;
