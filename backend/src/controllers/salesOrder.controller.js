const soService = require('../services/salesOrder.service');
const auditService = require('../services/audit.service');

const createSO = async (req, res, next) => {
  try {
    const so = await soService.createSO(req.user.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'SalesOrder',
      entityId: so.id,
      action: 'SALES_ORDER_CREATE',
      newValues: so
    });
    res.status(201).json({ success: true, message: 'Sales Order created', data: so });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getSOs = async (req, res, next) => {
  try {
    const sos = await soService.getSOs(req.query);
    res.status(200).json({ success: true, data: sos });
  } catch (error) {
    next(error);
  }
};

const getSOById = async (req, res, next) => {
  try {
    const so = await soService.getSOById(req.params.id);
    if (!so) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    res.status(200).json({ success: true, data: so });
  } catch (error) {
    next(error);
  }
};

const updateSO = async (req, res, next) => {
  try {
    const so = await soService.updateSO(req.params.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'SalesOrder',
      entityId: so.id,
      action: 'SALES_ORDER_UPDATE',
      newValues: so
    });
    res.status(200).json({ success: true, message: 'Sales Order updated', data: so });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const confirmSO = async (req, res, next) => {
  try {
    const so = await soService.confirmSO(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'SalesOrder',
      entityId: so.id,
      action: 'SALES_ORDER_CONFIRM'
    });
    res.status(200).json({ success: true, message: 'Sales Order confirmed', data: so });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelSO = async (req, res, next) => {
  try {
    const so = await soService.cancelSO(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'SalesOrder',
      entityId: so.id,
      action: 'SALES_ORDER_CANCEL'
    });
    res.status(200).json({ success: true, message: 'Sales Order cancelled', data: so });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = { createSO, getSOs, getSOById, updateSO, confirmSO, cancelSO };
