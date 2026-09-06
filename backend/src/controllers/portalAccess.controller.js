const prisma = require('../config/prisma');
const auditService = require('../services/audit.service');

/**
 * Portal access: which login accounts may see a customer's invoices.
 *
 * Portal visibility is driven by the CustomerUser join table. A USER account
 * with no link sees nothing, which is why every new portal account starts empty
 * until it is granted access to a customer here.
 */

const PORTAL_USER_FIELDS = {
  id: true,
  loginId: true,
  name: true,
  email: true,
  isActive: true,
};

/**
 * Registered USER accounts that can be granted portal access.
 * Deliberately narrow - it exposes identity only, never roles or permissions,
 * so it can be read by anyone who manages contacts.
 */
const listCandidates = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { name: 'USER' } },
      select: PORTAL_USER_FIELDS,
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/** Accounts currently able to see this customer's documents. */
const listForContact = async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const mappings = await prisma.customerUser.findMany({
      where: { customerId: contact.id },
      include: { user: { select: PORTAL_USER_FIELDS } },
    });

    res.status(200).json({ success: true, data: mappings.map((m) => m.user) });
  } catch (error) {
    next(error);
  }
};

const grant = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const contact = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    if (contact.type !== 'CUSTOMER') {
      return res.status(400).json({
        success: false,
        message: 'Portal access can only be granted on a CUSTOMER contact',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Internal staff already see everything; the portal mapping is for USER accounts.
    if (user.role.name !== 'USER') {
      return res.status(400).json({
        success: false,
        message: 'Only portal (USER) accounts can be granted customer access',
      });
    }

    const existing = await prisma.customerUser.findUnique({
      where: { userId_customerId: { userId, customerId: contact.id } },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This user already has access to the contact',
      });
    }

    await prisma.customerUser.create({ data: { userId, customerId: contact.id } });

    await auditService.log({
      userId: req.user.id,
      entityType: 'CustomerUser',
      entityId: contact.id,
      action: 'PORTAL_ACCESS_GRANT',
      newValues: { userId, customerId: contact.id },
    });

    res.status(201).json({
      success: true,
      message: 'Portal access granted',
      data: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

const revoke = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const existing = await prisma.customerUser.findUnique({
      where: { userId_customerId: { userId, customerId: id } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Portal access not found' });
    }

    await prisma.customerUser.delete({
      where: { userId_customerId: { userId, customerId: id } },
    });

    await auditService.log({
      userId: req.user.id,
      entityType: 'CustomerUser',
      entityId: id,
      action: 'PORTAL_ACCESS_REVOKE',
      oldValues: { userId, customerId: id },
    });

    res.status(200).json({ success: true, message: 'Portal access revoked' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listCandidates, listForContact, grant, revoke };
