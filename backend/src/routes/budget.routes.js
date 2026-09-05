const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateBudget, validateBudgetRevision } = require('../validators/budget.validator');

router.use(requireAuth);

router.get('/', requirePermission('budget.read'), budgetController.getBudgets);
router.get('/:id', requirePermission('budget.read'), budgetController.getBudgetById);
router.post('/', requirePermission('budget.create'), validateBudget, budgetController.createBudget);
router.patch('/:id', requirePermission('budget.update'), budgetController.updateBudget);
router.post('/:id/confirm', requirePermission('budget.confirm'), budgetController.confirmBudget);
router.post('/:id/revise', requirePermission('budget.revise'), validateBudgetRevision, budgetController.reviseBudget);
router.post('/:id/cancel', requirePermission('budget.cancel'), budgetController.cancelBudget);

module.exports = router;
