const accountService = require('../services/analyticAccount.service');
const auditService = require('../services/audit.service');

const createAccount = async (req, res, next) => {
  try {
    const account = await accountService.createAccount(req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'AnalyticAccount',
      entityId: account.id,
      action: 'ANALYTIC_ACCOUNT_CREATE',
      newValues: account
    });
    res.status(201).json({ success: true, message: 'Analytical Account created', data: account });
  } catch (error) {
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getAccounts();
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

const getAccountById = async (req, res, next) => {
  try {
    const account = await accountService.getAccountById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const oldAcc = await accountService.getAccountById(req.params.id);
    if (!oldAcc) return res.status(404).json({ success: false, message: 'Account not found' });

    const account = await accountService.updateAccount(req.params.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'AnalyticAccount',
      entityId: account.id,
      action: 'ANALYTIC_ACCOUNT_UPDATE',
      oldValues: oldAcc,
      newValues: account
    });
    res.status(200).json({ success: true, message: 'Account updated', data: account });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const account = await accountService.deleteAccount(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'AnalyticAccount',
      entityId: account.id,
      action: 'ANALYTIC_ACCOUNT_DELETE',
      oldValues: account
    });
    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (error) {
    if (error.message.startsWith('CONFLICT')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { createAccount, getAccounts, getAccountById, updateAccount, deleteAccount };
