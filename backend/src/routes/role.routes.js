const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ADMIN } = require('../constants/roles');

router.use(requireAuth);
router.use(requireRole(ADMIN));

// Read-only list so the Admin user-management screen can pick a roleId.
router.get('/', async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
