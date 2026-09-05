const prisma = require('../config/prisma');

const createAccount = async (data) => {
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  return await prisma.analyticAccount.create({ data });
};

const getAccounts = async () => {
  return await prisma.analyticAccount.findMany();
};

const getAccountById = async (id) => {
  return await prisma.analyticAccount.findUnique({ where: { id } });
};

const updateAccount = async (id, data) => {
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  return await prisma.analyticAccount.update({
    where: { id },
    data,
  });
};

const deleteAccount = async (id) => {
  const account = await prisma.analyticAccount.findUnique({
    where: { id },
    include: {
      budgets: true,
      soLines: true,
      invLines: true,
      poLines: true,
      billLines: true,
      journalItems: true,
    }
  });

  if (!account) {
    throw new Error('Analytical Account not found');
  }

  const inUse = 
    account.budgets.length > 0 ||
    account.soLines.length > 0 ||
    account.invLines.length > 0 ||
    account.poLines.length > 0 ||
    account.billLines.length > 0 ||
    account.journalItems.length > 0;

  if (inUse) {
    throw new Error('CONFLICT: Analytical Account is referenced by business lines and cannot be deleted.');
  }

  return await prisma.analyticAccount.delete({ where: { id } });
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
};
