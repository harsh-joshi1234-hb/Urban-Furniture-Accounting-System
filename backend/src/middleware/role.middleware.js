const prisma = require('../config/prisma');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user or role found',
      });
    }

    if (!allowedRoles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient role permissions',
      });
    }

    next();
  };
};

const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user or role found',
      });
    }

    // Reuse the shared client - instantiating PrismaClient per request
    // exhausts the Postgres connection pool.
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: req.user.roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const hasPermission = roleWithPermissions?.permissions.some(
      (rp) => rp.permission.code === permissionCode
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permissionCode}]`,
      });
    }

    next();
  };
};

module.exports = { requireRole, requirePermission };
