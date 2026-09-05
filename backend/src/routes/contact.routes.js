const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateContact } = require('../validators/masterData.validator');

router.use(requireAuth);

router.get('/', requirePermission('contact.read'), contactController.getContacts);
router.get('/:id', requirePermission('contact.read'), contactController.getContactById);
router.post('/', requirePermission('contact.create'), validateContact, contactController.createContact);
router.patch('/:id', requirePermission('contact.update'), contactController.updateContact);
router.delete('/:id', requirePermission('contact.delete'), contactController.deleteContact);

module.exports = router;
