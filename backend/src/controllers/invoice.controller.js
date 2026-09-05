const invoiceService = require('../services/invoice.service');
const auditService = require('../services/audit.service');

const createDirectInvoice = async (req, res, next) => {
  try {
    const inv = await invoiceService.createDirectInvoice(req.user.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'CustomerInvoice', entityId: inv.id, action: 'INVOICE_CREATE', newValues: inv });
    res.status(201).json({ success: true, message: 'Invoice created', data: inv });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const createInvoiceFromSO = async (req, res, next) => {
  try {
    const inv = await invoiceService.createInvoiceFromSO(req.user.id, req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'CustomerInvoice', entityId: inv.id, action: 'INVOICE_CREATE', newValues: inv });
    res.status(201).json({ success: true, message: 'Invoice created from SO', data: inv });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const invs = await invoiceService.getInvoices(req.query);
    res.status(200).json({ success: true, data: invs });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const inv = await invoiceService.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: inv });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const inv = await invoiceService.updateInvoice(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'CustomerInvoice', entityId: inv.id, action: 'INVOICE_UPDATE', newValues: inv });
    res.status(200).json({ success: true, message: 'Invoice updated', data: inv });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const confirmInvoice = async (req, res, next) => {
  try {
    const inv = await invoiceService.confirmInvoice(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'CustomerInvoice', entityId: inv.id, action: 'INVOICE_CONFIRM' });
    res.status(200).json({ success: true, message: 'Invoice confirmed', data: inv });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelInvoice = async (req, res, next) => {
  try {
    const inv = await invoiceService.cancelInvoice(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'CustomerInvoice', entityId: inv.id, action: 'INVOICE_CANCEL' });
    res.status(200).json({ success: true, message: 'Invoice cancelled', data: inv });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

module.exports = { createDirectInvoice, createInvoiceFromSO, getInvoices, getInvoiceById, updateInvoice, confirmInvoice, cancelInvoice };
