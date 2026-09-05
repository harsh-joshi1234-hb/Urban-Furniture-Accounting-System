const express = require('express');
const router = express.Router();
const accountController = require('../controllers/analyticAccount.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateAnalyticAccount } = require('../validators/masterData.validator');

router.use(requireAuth);

// Using account.read as seeded
router.get('/', requirePermission('account.read'), accountController.getAccounts);
router.get('/:id', requirePermission('account.read'), accountController.getAccountById);
router.post('/', requirePermission('account.create'), validateAnalyticAccount, accountController.createAccount);
router.patch('/:id', requirePermission('account.update'), accountController.updateAccount);
// Wait, account.delete wasn't explicitly seeded. Let's assume ADMIN/ACCOUNTANT can delete by using account.update or adding it.
// The prompt said: "account.read, account.create, account.update". It did not specify account.delete for analytical accounts in the list, but it says "Analytical Accounts: ADMIN: create/read/update/delete".
// I'll check account.update for deletion to be safe, since it wasn't seeded as account.delete.
router.delete('/:id', requirePermission('account.update'), accountController.deleteAccount);

module.exports = router;
