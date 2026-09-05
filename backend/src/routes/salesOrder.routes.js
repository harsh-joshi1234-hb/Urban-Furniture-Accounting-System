const express = require('express');
const router = express.Router();
const soController = require('../controllers/salesOrder.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateSalesOrder } = require('../validators/sales.validator');

router.use(requireAuth);

router.get('/', requirePermission('sales_order.read'), soController.getSOs);
router.get('/:id', requirePermission('sales_order.read'), soController.getSOById);
router.post('/', requirePermission('sales_order.create'), validateSalesOrder, soController.createSO);
router.patch('/:id', requirePermission('sales_order.update'), soController.updateSO);
router.post('/:id/confirm', requirePermission('sales_order.confirm'), soController.confirmSO);
router.post('/:id/cancel', requirePermission('sales_order.cancel'), soController.cancelSO);

module.exports = router;
