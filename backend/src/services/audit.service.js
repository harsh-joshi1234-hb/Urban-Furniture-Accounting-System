const prisma = require('../config/prisma');

/**
 * Reusable audit logging service.
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.entityType - The type of entity being affected (e.g. 'User', 'Invoice').
 * @param {string} params.entityId - The ID of the entity being affected.
 * @param {string} params.action - The action performed (e.g. 'CREATE', 'UPDATE', 'DEACTIVATE').
 * @param {Object} [params.oldValues] - The state of the entity before the action (optional).
 * @param {Object} [params.newValues] - The state of the entity after the action (optional).
 */
const log = async ({ userId, entityType, entityId, action, oldValues, newValues }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        entityType,
        entityId,
        action,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { log };
