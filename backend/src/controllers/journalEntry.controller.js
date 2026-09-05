const accountService = require('../services/accounting.service');
const auditService = require('../services/audit.service');

const createDraftEntry = async (req, res, next) => {
  try {
    const entry = await accountService.createDraftEntry(req.body);
    await auditService.log({ userId: req.user.id, entityType: 'JournalEntry', entityId: entry.id, action: 'JOURNAL_ENTRY_CREATE', newValues: entry });
    res.status(201).json({ success: true, message: 'Journal Entry created', data: entry });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const updateDraftEntry = async (req, res, next) => {
  try {
    const entry = await accountService.updateDraftEntry(req.params.id, req.body);
    await auditService.log({ userId: req.user.id, entityType: 'JournalEntry', entityId: entry.id, action: 'JOURNAL_ENTRY_UPDATE', newValues: entry });
    res.status(200).json({ success: true, message: 'Journal Entry updated', data: entry });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const postEntry = async (req, res, next) => {
  try {
    const entry = await accountService.postEntry(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'JournalEntry', entityId: entry.id, action: 'JOURNAL_ENTRY_POST' });
    res.status(200).json({ success: true, message: 'Journal Entry posted', data: entry });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const cancelEntry = async (req, res, next) => {
  try {
    const entry = await accountService.cancelEntry(req.params.id);
    await auditService.log({ userId: req.user.id, entityType: 'JournalEntry', entityId: entry.id, action: 'JOURNAL_ENTRY_CANCEL' });
    res.status(200).json({ success: true, message: 'Journal Entry cancelled', data: entry });
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ success: false, message: error.message });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

const getEntries = async (req, res, next) => {
  try {
    const entries = await accountService.getEntries(req.query);
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

const getEntryById = async (req, res, next) => {
  try {
    const entry = await accountService.getEntryById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Journal Entry not found' });
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDraftEntry,
  updateDraftEntry,
  postEntry,
  cancelEntry,
  getEntries,
  getEntryById
};
