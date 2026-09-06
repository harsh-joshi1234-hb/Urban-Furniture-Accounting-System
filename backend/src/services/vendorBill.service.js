const prisma = require('../config/prisma');
const accountingService = require('./accounting.service');

async function generateBillNumber() {
  const latest = await prisma.vendorBill.findFirst({
    orderBy: { number: 'desc' }
  });
  if (!latest) return 'BILL/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `BILL/2026/${nextNum.toString().padStart(4, '0')}`;
}

const createBillFromPO = async (userId, purchaseOrderId) => {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lines: { include: { product: true } } }
    });

    if (!po) throw new Error('NOT_FOUND: Purchase Order not found');
    if (po.status !== 'CONFIRMED') throw new Error('CONFLICT: Only CONFIRMED Purchase Orders can be billed');

    // Default Expense account for tests
    const account = await tx.chartOfAccount.findUnique({ where: { code: '500000' } });
    if (!account || !account.isActive) throw new Error('BAD_REQUEST: Default Expense Account (500000) not found or inactive');

    const billNumber = await generateBillNumber();

    const billLines = po.lines.map(line => ({
      productId: line.productId,
      accountId: account.id,
      analyticAccountId: line.analyticAccountId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total
    }));

    return await tx.vendorBill.create({
      data: {
        number: billNumber,
        purchaseOrderId: po.id,
        vendorId: po.vendorId,
        billDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30 days
        status: 'DRAFT',
        createdBy: userId,
        lines: { create: billLines }
      },
      include: { lines: true }
    });
  });
};

const createDirectBill = async (userId, data) => {
  const { vendorId, billReference, billDate, dueDate, lines } = data;

  const vendor = await prisma.contact.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.type !== 'VENDOR') {
    throw new Error('BAD_REQUEST: Invalid vendor');
  }

  return await prisma.$transaction(async (tx) => {
    const billNumber = await generateBillNumber();
    const computedLines = [];

    for (const line of lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid`);

      const account = await tx.chartOfAccount.findUnique({ where: { id: line.accountId } });
      if (!account || !account.isActive) throw new Error(`BAD_REQUEST: Account ${line.accountId} is invalid`);

      const unitPrice = line.unitPrice !== undefined ? line.unitPrice : product.cost;
      const total = Number(line.quantity) * Number(unitPrice);

      computedLines.push({
        productId: line.productId,
        accountId: line.accountId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: Number(line.quantity),
        unitPrice: unitPrice,
        total: total
      });
    }

    return await tx.vendorBill.create({
      data: {
        number: billNumber,
        vendorId,
        billReference,
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        createdBy: userId,
        lines: { create: computedLines }
      },
      include: { lines: true }
    });
  });
};

const getBills = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  return await prisma.vendorBill.findMany({
    where,
    include: { vendor: true, lines: true, allocations: true }
  });
};

const getBillById = async (id) => {
  return await prisma.vendorBill.findUnique({
    where: { id },
    include: { vendor: true, lines: { include: { product: true } }, allocations: { include: { payment: true } }, purchaseOrder: true }
  });
};

const updateBill = async (id, data) => {
  const bill = await getBillById(id);
  if (!bill) throw new Error('NOT_FOUND: Bill not found');
  if (bill.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT bills can be updated');

  const updateData = {};
  if (data.billReference) updateData.billReference = data.billReference;
  if (data.billDate) updateData.billDate = new Date(data.billDate);
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  return await prisma.vendorBill.update({
    where: { id },
    data: updateData,
    include: { lines: true }
  });
};

const confirmBill = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const bill = await tx.vendorBill.findUnique({ 
      where: { id },
      include: { lines: true }
    });
    if (!bill) throw new Error('NOT_FOUND: Bill not found');
    if (bill.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT bills can be confirmed');

    const updatedBill = await tx.vendorBill.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });

    const payableAccount = await tx.chartOfAccount.findUnique({ where: { code: '210000' } });
    if (!payableAccount) throw new Error('BAD_REQUEST: Payable account 210000 not found');

    const totalAmount = bill.lines.reduce((sum, line) => sum + Number(line.total), 0);
    const jeLines = [];
    jeLines.push({ accountId: payableAccount.id, debit: 0, credit: totalAmount, partnerId: bill.vendorId });
    for (const line of bill.lines) {
      jeLines.push({ accountId: line.accountId, debit: Number(line.total), credit: 0, analyticAccountId: line.analyticAccountId });
    }

    await accountingService.createSourceEntry(tx, {
      journalType: 'PURCHASE',
      partnerId: bill.vendorId,
      accountingDate: bill.billDate,
      documentDate: bill.billDate,
      sourceType: 'VENDOR_BILL',
      sourceId: bill.id,
      lines: jeLines
    });

    return updatedBill;
  });
};

const cancelBill = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const bill = await tx.vendorBill.findUnique({
      where: { id },
      include: { allocations: true }
    });
    if (!bill) throw new Error('NOT_FOUND: Bill not found');
    if (bill.allocations && bill.allocations.length > 0) {
      throw new Error('CONFLICT: Cannot cancel bill that has payments allocated');
    }

    return await tx.vendorBill.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  });
};

module.exports = {
  createBillFromPO,
  createDirectBill,
  getBills,
  getBillById,
  updateBill,
  confirmBill,
  cancelBill
};
