const prisma = require('../config/prisma');

// ----------------------------------------------------------------------
// CHART OF ACCOUNTS
// ----------------------------------------------------------------------

const createAccount = async (data) => {
  const existing = await prisma.chartOfAccount.findUnique({ where: { code: data.code } });
  if (existing) throw new Error('BAD_REQUEST: Account code must be unique');

  if (data.parentId) {
    const parent = await prisma.chartOfAccount.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new Error('BAD_REQUEST: Parent account not found');
  }

  return await prisma.chartOfAccount.create({ data });
};

const updateAccount = async (id, data) => {
  const account = await prisma.chartOfAccount.findUnique({ where: { id } });
  if (!account) throw new Error('NOT_FOUND: Account not found');

  if (data.code && data.code !== account.code) {
    const existing = await prisma.chartOfAccount.findUnique({ where: { code: data.code } });
    if (existing) throw new Error('BAD_REQUEST: Account code must be unique');
  }

  // Deactivation check: If attempting to deactivate, ensure we don't have pending stuff if we care (we just deactivate it)
  // Actually, standard says inactive accounts can't be used for *new* transactions.
  
  return await prisma.chartOfAccount.update({ where: { id }, data });
};

const getAccounts = async (filters) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';
  if (filters.type) where.type = filters.type;
  
  return await prisma.chartOfAccount.findMany({ where, include: { parent: true } });
};

const getAccountById = async (id) => {
  return await prisma.chartOfAccount.findUnique({ where: { id }, include: { parent: true, children: true } });
};

// ----------------------------------------------------------------------
// JOURNALS
// ----------------------------------------------------------------------

const createJournal = async (data) => {
  const account = await prisma.chartOfAccount.findUnique({ where: { id: data.defaultAccountId } });
  if (!account || !account.isActive) throw new Error('BAD_REQUEST: Default account must be active and valid');
  return await prisma.journal.create({ data });
};

const getJournals = async () => {
  return await prisma.journal.findMany({ include: { defaultAccount: true } });
};

const getJournalById = async (id) => {
  return await prisma.journal.findUnique({ where: { id }, include: { defaultAccount: true } });
};

// ----------------------------------------------------------------------
// JOURNAL ENTRIES
// ----------------------------------------------------------------------

async function generateEntryNumber(type) {
  const latest = await prisma.journalEntry.findFirst({
    where: { number: { startsWith: `${type}/2026/` } },
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return `${type}/2026/0001`;
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `${type}/2026/${nextNum.toString().padStart(4, '0')}`;
}

const validateLines = async (tx, lines) => {
  if (!lines || lines.length < 2) throw new Error('BAD_REQUEST: Journal Entry must have at least 2 lines');
  
  let totalDebit = 0;
  let totalCredit = 0;
  let hasDebit = false;
  let hasCredit = false;

  for (const line of lines) {
  
    if (line.debit < 0 || line.credit < 0) throw new Error('BAD_REQUEST: Debit and credit must be non-negative');
    if (line.debit > 0 && line.credit > 0) throw new Error('BAD_REQUEST: A line cannot contain both debit and credit');
    
    if (line.debit > 0) { totalDebit += Number(line.debit); hasDebit = true; }
    if (line.credit > 0) { totalCredit += Number(line.credit); hasCredit = true; }

    const acc = await tx.chartOfAccount.findUnique({ where: { id: line.accountId } });
    if (!acc || !acc.isActive) throw new Error(`BAD_REQUEST: Account ${line.accountId} is invalid or inactive`);
  }

  if (!hasDebit || !hasCredit) throw new Error('BAD_REQUEST: At least one debit and one credit must exist');
  
  // Dealing with decimal comparison requires epsilon or string parsing, but here we can just use Number precision limits since we cap to 2 decimals typically
  if (Math.abs(totalDebit - totalCredit) > 0.001) throw new Error('BAD_REQUEST: Sum of debits must equal sum of credits');

  return totalDebit;
};

const createDraftEntry = async (data) => {
  return await prisma.$transaction(async (tx) => {
    const journal = await tx.journal.findUnique({ where: { id: data.journalId } });
    if (!journal || !journal.isActive) throw new Error('BAD_REQUEST: Invalid or inactive journal');

    const total = await validateLines(tx, data.items);
    const entryNumber = await generateEntryNumber(journal.type);

    return await tx.journalEntry.create({
      data: {
        number: entryNumber,
        journalId: data.journalId,
        partnerId: data.partnerId || null,
        accountingDate: new Date(data.accountingDate),
        documentDate: new Date(data.documentDate),
        sourceType: data.sourceType || 'MANUAL',
        sourceId: data.sourceId || null,
        status: 'DRAFT',
        total: total,
        items: {
          create: data.items.map(item => ({
            accountId: item.accountId,
            partnerId: item.partnerId || null,
            analyticAccountId: item.analyticAccountId || null,
            debit: item.debit || 0,
            credit: item.credit || 0,
            description: item.description || ''
          }))
        }
      },
      include: { items: true }
    });
  });
};

const updateDraftEntry = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new Error('NOT_FOUND: Journal Entry not found');
    if (entry.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT entries can be edited');

    // If updating items, replace all items for simplicity
    let total = entry.total;
    if (data.items) {
      total = await validateLines(tx, data.items);
      await tx.journalItem.deleteMany({ where: { entryId: id } });
      
      for (const item of data.items) {
        await tx.journalItem.create({
          data: {
            entryId: id,
            accountId: item.accountId,
            partnerId: item.partnerId || null,
            analyticAccountId: item.analyticAccountId || null,
            debit: item.debit || 0,
            credit: item.credit || 0,
            description: item.description || ''
          }
        });
      }
    }

    const updateData = {};
    if (data.accountingDate) updateData.accountingDate = new Date(data.accountingDate);
    if (data.documentDate) updateData.documentDate = new Date(data.documentDate);
    if (data.partnerId !== undefined) updateData.partnerId = data.partnerId;
    if (data.items) updateData.total = total;

    return await tx.journalEntry.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });
  });
};

const postEntry = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({ where: { id }, include: { items: true } });
    if (!entry) throw new Error('NOT_FOUND: Journal Entry not found');
    if (entry.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT entries can be posted');
    
    // Final check for balance
    await validateLines(tx, entry.items);

    return await tx.journalEntry.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() },
      include: { items: true }
    });
  });
};

const cancelEntry = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new Error('NOT_FOUND: Journal Entry not found');
    if (entry.status === 'CANCELLED') throw new Error('CONFLICT: Entry is already cancelled');
    
    return await tx.journalEntry.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { items: true }
    });
  });
};

const getEntries = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.journalId) where.journalId = filters.journalId;
  return await prisma.journalEntry.findMany({ where, include: { items: true, journal: true } });
};

const getEntryById = async (id) => {
  return await prisma.journalEntry.findUnique({ where: { id }, include: { items: true, journal: true } });
};

// ----------------------------------------------------------------------
// LEDGER AND BALANCES
// ----------------------------------------------------------------------

const getAccountBalance = async (accountId, startDate, endDate) => {
  const account = await prisma.chartOfAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('NOT_FOUND: Account not found');

  const where = {
    accountId,
    entry: { status: 'POSTED' }
  };
  
  if (startDate || endDate) {
    where.entry.accountingDate = {};
    if (startDate) where.entry.accountingDate.gte = new Date(startDate);
    if (endDate) where.entry.accountingDate.lte = new Date(endDate);
  }

  const items = await prisma.journalItem.findMany({ where });

  let debitTotal = 0;
  let creditTotal = 0;
  
  items.forEach(item => {
    debitTotal += Number(item.debit);
    creditTotal += Number(item.credit);
  });

  // Calculate balance depending on account type (Asset/Expense normal balance is Debit. Liability/Equity/Income normal balance is Credit)
  let balance = 0;
  if (['ASSET', 'EXPENSE', 'BANK', 'CASH', 'OTHER_EXPENSE'].includes(account.type)) {
    balance = debitTotal - creditTotal;
  } else {
    balance = creditTotal - debitTotal;
  }

  return { accountId, name: account.name, type: account.type, debitTotal, creditTotal, balance };
};

const getLedger = async (accountId, startDate, endDate) => {
  const account = await prisma.chartOfAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('NOT_FOUND: Account not found');

  const where = {
    accountId,
    entry: { status: 'POSTED' }
  };

  if (startDate || endDate) {
    where.entry.accountingDate = {};
    if (startDate) where.entry.accountingDate.gte = new Date(startDate);
    if (endDate) where.entry.accountingDate.lte = new Date(endDate);
  }

  return await prisma.journalItem.findMany({
    where,
    include: { entry: true },
    orderBy: { entry: { accountingDate: 'asc' } }
  });
};

// ----------------------------------------------------------------------
// SOURCE AUTOMATION (Exported to be used by Invoice/Bill/Payment)
// ----------------------------------------------------------------------

const createSourceEntry = async (tx, params) => {
  const { journalType, partnerId, accountingDate, documentDate, sourceType, sourceId, lines } = params;
  
  // Prevent duplicate
  const existing = await tx.journalEntry.findFirst({
    where: { sourceType, sourceId, status: { not: 'CANCELLED' } }
  });
  if (existing) return existing; // Skip if already handled

  const journal = await tx.journal.findFirst({ where: { type: journalType } });
  if (!journal) throw new Error(`BAD_REQUEST: Missing system journal for ${journalType}`);

  const total = await validateLines(tx, lines);
  const entryNumber = await generateEntryNumber(journal.type);

  return await tx.journalEntry.create({
    data: {
      number: entryNumber,
      journalId: journal.id,
      partnerId,
      accountingDate: new Date(accountingDate),
      documentDate: new Date(documentDate),
      sourceType,
      sourceId,
      status: 'POSTED', // Auto-post automated entries
      postedAt: new Date(),
      total,
      items: {
        create: lines.map(item => ({
          accountId: item.accountId,
          partnerId: item.partnerId || partnerId,
          analyticAccountId: item.analyticAccountId || null,
          debit: item.debit || 0,
          credit: item.credit || 0,
          description: item.description || ''
        }))
      }
    }
  });
};

module.exports = {
  createAccount,
  updateAccount,
  getAccounts,
  getAccountById,
  createJournal,
  getJournals,
  getJournalById,
  createDraftEntry,
  updateDraftEntry,
  postEntry,
  cancelEntry,
  getEntries,
  getEntryById,
  getAccountBalance,
  getLedger,
  createSourceEntry
};
