const accountService = require('../services/accounting.service');
const auditService = require('../services/audit.service');

const createJournal = async (req, res, next) => {
  try {
    const journal = await accountService.createJournal(req.body);
    await auditService.log({ userId: req.user.id, entityType: 'Journal', entityId: journal.id, action: 'JOURNAL_CREATE', newValues: journal });
    res.status(201).json({ success: true, message: 'Journal created', data: journal });
  } catch (error) {
    if (error.message.startsWith('BAD_REQUEST')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const getJournals = async (req, res, next) => {
  try {
    const journals = await accountService.getJournals();
    res.status(200).json({ success: true, data: journals });
  } catch (error) {
    next(error);
  }
};

const getJournalById = async (req, res, next) => {
  try {
    const journal = await accountService.getJournalById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found' });
    res.status(200).json({ success: true, data: journal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJournal,
  getJournals,
  getJournalById
};
