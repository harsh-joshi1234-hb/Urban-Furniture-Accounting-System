const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateJournal } = require('../validators/accounting.validator');

router.use(requireAuth);

router.get('/', requirePermission('journal.read'), journalController.getJournals);
router.get('/:id', requirePermission('journal.read'), journalController.getJournalById);
router.post('/', requirePermission('journal.create'), validateJournal, journalController.createJournal);

module.exports = router;
