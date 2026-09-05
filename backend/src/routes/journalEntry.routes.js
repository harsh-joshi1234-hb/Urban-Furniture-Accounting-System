const express = require('express');
const router = express.Router();
const journalEntryController = require('../controllers/journalEntry.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateJournalEntry } = require('../validators/accounting.validator');

router.use(requireAuth);

router.get('/', requirePermission('journal_entry.read'), journalEntryController.getEntries);
router.get('/:id', requirePermission('journal_entry.read'), journalEntryController.getEntryById);
router.post('/', requirePermission('journal_entry.create'), validateJournalEntry, journalEntryController.createDraftEntry);
router.patch('/:id', requirePermission('journal_entry.create'), journalEntryController.updateDraftEntry);
router.post('/:id/post', requirePermission('journal_entry.post'), journalEntryController.postEntry);
router.post('/:id/cancel', requirePermission('journal_entry.cancel'), journalEntryController.cancelEntry);

module.exports = router;
