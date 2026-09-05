const poService = require('../services/purchaseOrder.service');
const auditService = require('../services/audit.service');

const createPO = async (req, res, next) => {
  try {
    const po = await poService.createPO(req.user.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'PurchaseOrder', entityId: po.id, action: 'PURCHASE_ORDER_CREATE', newValues: po });
    res.status(201).json({ success: true, message: 'Purchase Order created', data: po });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getPOs = async (req, res, next) => {
  try {
    const pos = await poService.getPOs(req.query);
    res.status(200).json({ success: true, data: pos });
  } catch (error) {
    next(error);
  }
};

const getPOById = async (req, res, next) => {
  try {
    const po = await poService.getPOById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

const updatePO = async (req, res, next) => {
  try {
    const po = await poService.updatePO(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'PurchaseOrder', entityId: po.id, action: 'PURCHASE_ORDER_UPDATE', newValues: po });
    res.status(200).json({ success: true, message: 'Purchase Order updated', data: po });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const confirmPO = async (req, res, next) => {
  try {
    const po = await poService.confirmPO(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'PurchaseOrder', entityId: po.id, action: 'PURCHASE_ORDER_CONFIRM' });
    res.status(200).json({ success: true, message: 'Purchase Order confirmed', data: po });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelPO = async (req, res, next) => {
  try {
    const po = await poService.cancelPO(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'PurchaseOrder', entityId: po.id, action: 'PURCHASE_ORDER_CANCEL' });
    res.status(200).json({ success: true, message: 'Purchase Order cancelled', data: po });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = { createPO, getPOs, getPOById, updatePO, confirmPO, cancelPO };
