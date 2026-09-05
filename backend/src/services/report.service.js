const prisma = require('../config/prisma');
const budgetService = require('./budget.service');

const getProfitLoss = async (startDate, endDate) => {
  const where = {
    entry: { status: 'POSTED' },
    account: { type: { in: ['INCOME', 'EXPENSE', 'OTHER_EXPENSE'] } }
  };

  if (startDate || endDate) {
    where.entry.accountingDate = {};
    if (startDate) where.entry.accountingDate.gte = new Date(startDate);
    if (endDate) where.entry.accountingDate.lte = new Date(endDate);
  }

  const items = await prisma.journalItem.findMany({
    where,
    include: { account: true }
  });

  const incomeAccounts = {};
  const expenseAccounts = {};

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const item of items) {
    const acc = item.account;
    const debit = Number(item.debit);
    const credit = Number(item.credit);

    if (acc.type === 'INCOME') {
      if (!incomeAccounts[acc.id]) {
        incomeAccounts[acc.id] = { code: acc.code, name: acc.name, amount: 0 };
      }
      // Income normal balance is Credit
      const net = credit - debit;
      incomeAccounts[acc.id].amount += net;
      totalIncome += net;
    } else {
      if (!expenseAccounts[acc.id]) {
        expenseAccounts[acc.id] = { code: acc.code, name: acc.name, amount: 0 };
      }
      // Expense normal balance is Debit
      const net = debit - credit;
      expenseAccounts[acc.id].amount += net;
      totalExpenses += net;
    }
  }

  return {
    period: { startDate, endDate },
    income: Object.values(incomeAccounts),
    expenses: Object.values(expenseAccounts),
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses
  };
};

const getBalanceSheet = async (asOfDate) => {
  const where = {
    entry: { status: 'POSTED' }
  };

  if (asOfDate) {
    where.entry.accountingDate = { lte: new Date(asOfDate) };
  }

  const items = await prisma.journalItem.findMany({
    where,
    include: { account: true }
  });

  const assetAccounts = {};
  const liabilityAccounts = {};
  const capitalAccounts = {};

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalCapital = 0;
  
  // To track retained earnings (Net Income of all time up to asOfDate)
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const item of items) {
    const acc = item.account;
    const debit = Number(item.debit);
    const credit = Number(item.credit);

    if (['ASSET', 'BANK', 'CASH'].includes(acc.type)) {
      if (!assetAccounts[acc.id]) assetAccounts[acc.id] = { code: acc.code, name: acc.name, amount: 0 };
      // Asset normal balance is Debit
      const net = debit - credit;
      assetAccounts[acc.id].amount += net;
      totalAssets += net;
    } else if (acc.type === 'LIABILITY') {
      if (!liabilityAccounts[acc.id]) liabilityAccounts[acc.id] = { code: acc.code, name: acc.name, amount: 0 };
      // Liability normal balance is Credit
      const net = credit - debit;
      liabilityAccounts[acc.id].amount += net;
      totalLiabilities += net;
    } else if (acc.type === 'CAPITAL') {
      if (!capitalAccounts[acc.id]) capitalAccounts[acc.id] = { code: acc.code, name: acc.name, amount: 0 };
      // Capital normal balance is Credit
      const net = credit - debit;
      capitalAccounts[acc.id].amount += net;
      totalCapital += net;
    } else if (acc.type === 'INCOME') {
      totalIncome += (credit - debit);
    } else if (['EXPENSE', 'OTHER_EXPENSE'].includes(acc.type)) {
      totalExpenses += (debit - credit);
    }
  }

  // Calculate Retained Earnings (Net Income) and add it to Capital to balance the equation
  const retainedEarnings = totalIncome - totalExpenses;
  capitalAccounts['retained_earnings'] = {
    code: 'RETAINED',
    name: 'Retained Earnings (Net Income)',
    amount: retainedEarnings
  };
  totalCapital += retainedEarnings;

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalCapital)) < 0.001;

  return {
    asOfDate,
    assets: Object.values(assetAccounts),
    liabilities: Object.values(liabilityAccounts),
    capital: Object.values(capitalAccounts),
    totalAssets,
    totalLiabilities,
    totalCapital,
    isBalanced
  };
};

const getBudgetReport = async (filters) => {
  const budgets = await budgetService.getBudgets(filters);
  
  return {
    budgets: budgets.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      analyticAccount: b.analyticAccount ? b.analyticAccount.name : null,
      startDate: b.startDate,
      endDate: b.endDate,
      committedAmount: Number(b.committedAmount),
      achievedAmount: Number(b.achievedAmount),
      amountToAchieve: Number(b.amountToAchieve),
      achievedPct: Number(b.achievedPct),
      responsible: b.responsibleContact ? b.responsibleContact.name : null,
      status: b.status
    }))
  };
};

module.exports = {
  getProfitLoss,
  getBalanceSheet,
  getBudgetReport
};
