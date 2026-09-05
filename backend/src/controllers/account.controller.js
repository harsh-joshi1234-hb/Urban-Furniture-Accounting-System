const accountService = require('../services/accounting.service');
const auditService = require('../services/audit.service');

const createAccount = async (req, res, next) => {
  try {
    const acc = await accountService.createAccount(req.body);
    await auditService.log({ userId: req.user.id, entityType: 'ChartOfAccount', entityId: acc.id, action: 'COA_CREATE', newValues: acc });
    res.status(201).json({ success: true, message: 'Account created', data: acc });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const acc = await accountService.updateAccount(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'ChartOfAccount', entityId: acc.id, action: 'COA_UPDATE', newValues: acc });
    res.status(200).json({ success: true, message: 'Account updated', data: acc });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getAccounts(req.query);
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

const getAccountBalance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const balance = await accountService.getAccountBalance(req.params.id, startDate, endDate);
    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    next(error);
  }
};

const getLedger = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await accountService.getLedger(req.params.id, startDate, endDate);
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = {
  createAccount,
  updateAccount,
  getAccounts,
  getAccountById,
  getAccountBalance,
  getLedger
};
