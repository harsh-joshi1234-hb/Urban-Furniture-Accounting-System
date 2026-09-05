const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateProfitLoss, validateBalanceSheet, validateBudgetReport } = require('../validators/report.validator');

router.use(requireAuth);

router.get('/profit-loss', requirePermission('report.read'), validateProfitLoss, reportController.getProfitLoss);
router.get('/balance-sheet', requirePermission('report.read'), validateBalanceSheet, reportController.getBalanceSheet);
router.get('/budget', requirePermission('report.read'), validateBudgetReport, reportController.getBudgetReport);

module.exports = router;
