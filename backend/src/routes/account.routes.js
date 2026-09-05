const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateAccount } = require('../validators/accounting.validator');

router.use(requireAuth);

router.get('/', requirePermission('account.read'), accountController.getAccounts);
router.get('/:id', requirePermission('account.read'), accountController.getAccountById);
router.post('/', requirePermission('account.create'), validateAccount, accountController.createAccount);
router.patch('/:id', requirePermission('account.update'), accountController.updateAccount);
router.get('/:id/balance', requirePermission('account.read'), accountController.getAccountBalance);
router.get('/:id/ledger', requirePermission('account.read'), accountController.getLedger);

module.exports = router;
