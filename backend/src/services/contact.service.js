const prisma = require('../config/prisma');

const createContact = async (data) => {
  return await prisma.contact.create({ data });
};

const getContacts = async (type) => {
  const where = type ? { type } : {};
  return await prisma.contact.findMany({ where });
};

const getContactById = async (id) => {
  return await prisma.contact.findUnique({ where: { id } });
};

const updateContact = async (id, data) => {
  return await prisma.contact.update({
    where: { id },
    data,
  });
};

const deleteContact = async (id) => {
  // Check for references before deleting
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      userLinks: true,
      soList: true,
      invoices: true,
      poList: true,
      bills: true,
      payments: true,
      journalEntries: true,
      journalItems: true,
      budgets: true,
    }
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  const inUse = 
    contact.userLinks.length > 0 ||
    contact.soList.length > 0 ||
    contact.invoices.length > 0 ||
    contact.poList.length > 0 ||
    contact.bills.length > 0 ||
    contact.payments.length > 0 ||
    contact.journalEntries.length > 0 ||
    contact.journalItems.length > 0 ||
    contact.budgets.length > 0;

  if (inUse) {
    throw new Error('CONFLICT: Contact is referenced by business records and cannot be deleted.');
  }

  return await prisma.contact.delete({ where: { id } });
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact
};
