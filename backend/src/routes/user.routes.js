const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole, requirePermission } = require('../middleware/role.middleware');
const { createUserValidator } = require('../validators/user.validator');
const { ADMIN } = require('../constants/roles');

router.use(requireAuth);
// Admin only middleware for user management routes
router.use(requireRole(ADMIN));

router.get('/', requirePermission('user.read'), userController.getAllUsers);
router.get('/:id', requirePermission('user.read'), userController.getUserById);
router.post('/', requirePermission('user.create'), createUserValidator, userController.createUser);
router.patch('/:id', requirePermission('user.update'), userController.updateUser);
router.patch('/:id/deactivate', requirePermission('user.deactivate'), userController.deactivateUser);
router.patch('/:id/activate', requirePermission('user.update'), userController.activateUser);

module.exports = router;
