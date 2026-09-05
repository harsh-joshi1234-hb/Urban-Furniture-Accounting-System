const prisma = require('../config/prisma');

const calculateAchievement = async (tx, analyticAccountId, type, startDate, endDate) => {
  let achievedAmount = 0;
  
  if (type === 'INCOME') {
    // Income -> look at CONFIRMED/PAID/PARTIALLY_PAID CustomerInvoice lines mapped to this analytic account
    const invoiceLines = await tx.customerInvoiceLine.findMany({
      where: {
        analyticAccountId,
        invoice: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: new Date(startDate), lte: new Date(endDate) }
        }
      }
    });
    achievedAmount = invoiceLines.reduce((sum, line) => sum + Number(line.total), 0);
  } else if (type === 'EXPENSE') {
    // Expense -> look at CONFIRMED/PAID/PARTIALLY_PAID VendorBill lines
    const billLines = await tx.vendorBillLine.findMany({
      where: {
        analyticAccountId,
        vendorBill: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          billDate: { gte: new Date(startDate), lte: new Date(endDate) }
        }
      }
    });
    achievedAmount = billLines.reduce((sum, line) => sum + Number(line.total), 0);
  }

  return achievedAmount;
};

const createBudget = async (data) => {
  const analytic = await prisma.analyticAccount.findUnique({ where: { id: data.analyticAccountId } });
  if (!analytic || !analytic.isActive) throw new Error('BAD_REQUEST: Invalid or inactive Analytic Account');

  return await prisma.budget.create({
    data: {
      name: data.name,
      analyticAccountId: data.analyticAccountId,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      committedAmount: Number(data.committedAmount),
      responsibleContactId: data.responsibleContactId,
      status: 'DRAFT'
    }
  });
};

const updateBudget = async (id, data) => {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) throw new Error('NOT_FOUND: Budget not found');
  if (budget.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT budgets can be updated');

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.committedAmount !== undefined) updateData.committedAmount = Number(data.committedAmount);
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return await prisma.budget.update({ where: { id }, data: updateData });
};

const confirmBudget = async (id) => {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) throw new Error('NOT_FOUND: Budget not found');
  if (budget.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT budgets can be confirmed');

  return await prisma.budget.update({ where: { id }, data: { status: 'CONFIRMED' } });
};

const cancelBudget = async (id) => {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) throw new Error('NOT_FOUND: Budget not found');
  if (budget.status === 'CANCELLED') throw new Error('CONFLICT: Budget is already cancelled');
  if (budget.status === 'REVISED') throw new Error('CONFLICT: REVISED budgets cannot be cancelled directly');

  return await prisma.budget.update({ where: { id }, data: { status: 'CANCELLED' } });
};

const reviseBudget = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    const original = await tx.budget.findUnique({ where: { id } });
    if (!original) throw new Error('NOT_FOUND: Budget not found');
    if (original.status !== 'CONFIRMED') throw new Error('CONFLICT: Only CONFIRMED budgets can be revised');

    // Mark original as REVISED
    await tx.budget.update({ where: { id }, data: { status: 'REVISED' } });

    // Create new budget cloned from original but with new amount
    return await tx.budget.create({
      data: {
        name: `${original.name} (Rev)`,
        analyticAccountId: original.analyticAccountId,
        type: original.type,
        startDate: original.startDate,
        endDate: data.endDate ? new Date(data.endDate) : original.endDate,
        committedAmount: Number(data.committedAmount),
        responsibleContactId: original.responsibleContactId,
        status: 'CONFIRMED',
        revisionOfId: original.id
      }
    });
  });
};

const getBudgets = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.analyticAccountId) where.analyticAccountId = filters.analyticAccountId;
  if (filters.responsibleContactId) where.responsibleContactId = filters.responsibleContactId;
  
  if (filters.startDate || filters.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.endDate = {};
    if (filters.endDate) where.endDate.lte = new Date(filters.endDate);
  }

  const budgets = await prisma.budget.findMany({ where, include: { analyticAccount: true, responsibleContact: true } });
  
  // Calculate dynamic achievement for each
  return await Promise.all(budgets.map(async (b) => {
    const achievedAmount = await calculateAchievement(prisma, b.analyticAccountId, b.type, b.startDate, b.endDate);
    const amountToAchieve = Number(b.committedAmount) - achievedAmount;
    let achievedPct = 0;
    if (Number(b.committedAmount) > 0) {
      achievedPct = (achievedAmount / Number(b.committedAmount)) * 100;
    } else {
      achievedPct = achievedAmount > 0 ? 100 : 0;
    }
    
    return { ...b, achievedAmount, amountToAchieve, achievedPct };
  }));
};

const getBudgetById = async (id) => {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { analyticAccount: true, responsibleContact: true, revisedBudgets: true, revisionOf: true }
  });
  if (!budget) return null;

  const achievedAmount = await calculateAchievement(prisma, budget.analyticAccountId, budget.type, budget.startDate, budget.endDate);
  const amountToAchieve = Number(budget.committedAmount) - achievedAmount;
  let achievedPct = 0;
  if (Number(budget.committedAmount) > 0) {
    achievedPct = (achievedAmount / Number(budget.committedAmount)) * 100;
  } else {
    achievedPct = achievedAmount > 0 ? 100 : 0;
  }
  
  return { ...budget, achievedAmount, amountToAchieve, achievedPct };
};

module.exports = {
  createBudget,
  updateBudget,
  confirmBudget,
  cancelBudget,
  reviseBudget,
  getBudgets,
  getBudgetById
};
