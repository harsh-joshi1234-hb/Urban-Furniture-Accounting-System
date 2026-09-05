const billService = require('../services/vendorBill.service');
const auditService = require('../services/audit.service');

const createDirectBill = async (req, res, next) => {
  try {
    const bill = await billService.createDirectBill(req.user.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'VendorBill', entityId: bill.id, action: 'VENDOR_BILL_CREATE', newValues: bill });
    res.status(201).json({ success: true, message: 'Vendor Bill created', data: bill });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const createBillFromPO = async (req, res, next) => {
  try {
    const bill = await billService.createBillFromPO(req.user.id, req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'VendorBill', entityId: bill.id, action: 'VENDOR_BILL_CREATE', newValues: bill });
    res.status(201).json({ success: true, message: 'Vendor Bill created from PO', data: bill });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getBills = async (req, res, next) => {
  try {
    const bills = await billService.getBills(req.query);
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    next(error);
  }
};

const getBillById = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Vendor Bill not found' });
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
};

const updateBill = async (req, res, next) => {
  try {
    const bill = await billService.updateBill(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'VendorBill', entityId: bill.id, action: 'VENDOR_BILL_UPDATE', newValues: bill });
    res.status(200).json({ success: true, message: 'Vendor Bill updated', data: bill });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const confirmBill = async (req, res, next) => {
  try {
    const bill = await billService.confirmBill(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'VendorBill', entityId: bill.id, action: 'VENDOR_BILL_CONFIRM' });
    res.status(200).json({ success: true, message: 'Vendor Bill confirmed', data: bill });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelBill = async (req, res, next) => {
  try {
    const bill = await billService.cancelBill(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'VendorBill', entityId: bill.id, action: 'VENDOR_BILL_CANCEL' });
    res.status(200).json({ success: true, message: 'Vendor Bill cancelled', data: bill });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = { createDirectBill, createBillFromPO, getBills, getBillById, updateBill, confirmBill, cancelBill };
