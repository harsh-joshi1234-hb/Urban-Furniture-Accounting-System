const budgetService = require('../services/budget.service');
const auditService = require('../services/audit.service');

const createBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.createBudget(req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Budget', entityId: budget.id, action: 'BUDGET_CREATE', newValues: budget });
    res.status(201).json({ success: true, message: 'Budget created', data: budget });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.updateBudget(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Budget', entityId: budget.id, action: 'BUDGET_UPDATE', newValues: budget });
    res.status(200).json({ success: true, message: 'Budget updated', data: budget });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const confirmBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.confirmBudget(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'Budget', entityId: budget.id, action: 'BUDGET_CONFIRM' });
    res.status(200).json({ success: true, message: 'Budget confirmed', data: budget });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.cancelBudget(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'Budget', entityId: budget.id, action: 'BUDGET_CANCEL' });
    res.status(200).json({ success: true, message: 'Budget cancelled', data: budget });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const reviseBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.reviseBudget(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Budget', entityId: budget.id, action: 'BUDGET_REVISE', newValues: budget });
    res.status(201).json({ success: true, message: 'Budget revised', data: budget });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgets(req.query);
    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
};

const getBudgetById = async (req, res, next) => {
  try {
    const budget = await budgetService.getBudgetById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  updateBudget,
  confirmBudget,
  cancelBudget,
  reviseBudget,
  getBudgets,
  getBudgetById
};
