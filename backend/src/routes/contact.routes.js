const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateContact } = require('../validators/masterData.validator');
const portalAccess = require('../controllers/portalAccess.controller');

router.use(requireAuth);

router.get('/', requirePermission('contact.read'), contactController.getContacts);

// ---- Portal access (which login accounts can see a customer's documents) ----
// Declared before '/:id' so the literal path is not captured as an id.
router.get('/portal-candidates', requirePermission('contact.read'), portalAccess.listCandidates);
router.get('/:id/portal-users', requirePermission('contact.read'), portalAccess.listForContact);
router.post('/:id/portal-users', requirePermission('contact.update'), portalAccess.grant);
router.delete('/:id/portal-users/:userId', requirePermission('contact.update'), portalAccess.revoke);
router.get('/:id', requirePermission('contact.read'), contactController.getContactById);
router.post('/', requirePermission('contact.create'), validateContact, contactController.createContact);
router.patch('/:id', requirePermission('contact.update'), contactController.updateContact);
router.delete('/:id', requirePermission('contact.delete'), contactController.deleteContact);

module.exports = router;
