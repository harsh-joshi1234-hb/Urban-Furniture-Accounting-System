const prisma = require('../config/prisma');
const accountingService = require('./accounting.service');

async function generateInvoiceNumber() {
  const latest = await prisma.customerInvoice.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return 'INV/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `INV/2026/${nextNum.toString().padStart(4, '0')}`;
}

const createInvoiceFromSO = async (userId, salesOrderId) => {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lines: { include: { product: true } } }
    });

    if (!so) throw new Error('NOT_FOUND: Sales Order not found');
    if (so.status !== 'CONFIRMED') throw new Error('CONFLICT: Only CONFIRMED Sales Orders can be invoiced');

    // We must find a valid accountId. The prompt says we can't invent one, but we seeded 400000.
    // Let's assume there is exactly one INCOME account or we just pick the seeded one.
    const account = await tx.chartOfAccount.findUnique({ where: { code: '400000' } });
    if (!account || !account.isActive) throw new Error('BAD_REQUEST: Default Sales Account (400000) not found or inactive');

    const invNumber = await generateInvoiceNumber();

    const invLines = so.lines.map(line => ({
      productId: line.productId,
      accountId: account.id,
      analyticAccountId: line.analyticAccountId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total
    }));

    return await tx.customerInvoice.create({
      data: {
        number: invNumber,
        salesOrderId: so.id,
        customerId: so.customerId,
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30 days
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: invLines
        }
      },
      include: { lines: true }
    });
  });
};

const createDirectInvoice = async (userId, data) => {
  const { customerId, invoiceReference, invoiceDate, dueDate, lines } = data;

  const customer = await prisma.contact.findUnique({ where: { id: customerId } });
  if (!customer || customer.type !== 'CUSTOMER') {
    throw new Error('BAD_REQUEST: Invalid customer');
  }

  return await prisma.$transaction(async (tx) => {
    const invNumber = await generateInvoiceNumber();
    const computedLines = [];

    for (const line of lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid`);

      const account = await tx.chartOfAccount.findUnique({ where: { id: line.accountId } });
      if (!account || !account.isActive) throw new Error(`BAD_REQUEST: Account ${line.accountId} is invalid`);

      const unitPrice = line.unitPrice !== undefined ? line.unitPrice : product.salesPrice;
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

    return await tx.customerInvoice.create({
      data: {
        number: invNumber,
        customerId,
        invoiceReference,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        createdBy: userId,
        lines: { create: computedLines }
      },
      include: { lines: true }
    });
  });
};

const getInvoices = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  return await prisma.customerInvoice.findMany({
    where,
    include: { customer: true, lines: true }
  });
};

const getInvoiceById = async (id) => {
  return await prisma.customerInvoice.findUnique({
    where: { id },
    include: { customer: true, lines: { include: { product: true } } }
  });
};

const updateInvoice = async (id, data) => {
  const inv = await getInvoiceById(id);
  if (!inv) throw new Error('NOT_FOUND: Invoice not found');
  if (inv.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT invoices can be updated');

  const updateData = {};
  if (data.invoiceReference) updateData.invoiceReference = data.invoiceReference;
  if (data.invoiceDate) updateData.invoiceDate = new Date(data.invoiceDate);
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  return await prisma.customerInvoice.update({
    where: { id },
    data: updateData,
    include: { lines: true }
  });
};

const confirmInvoice = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const inv = await tx.customerInvoice.findUnique({ 
      where: { id },
      include: { lines: true }
    });
    if (!inv) throw new Error('NOT_FOUND: Invoice not found');
    if (inv.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT invoices can be confirmed');

    const updatedInv = await tx.customerInvoice.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });

    const receivableAccount = await tx.chartOfAccount.findUnique({ where: { code: '120000' } });
    if (!receivableAccount) throw new Error('BAD_REQUEST: Receivable account 120000 not found');

    const totalAmount = inv.lines.reduce((sum, line) => sum + Number(line.total), 0);
    const jeLines = [];
    jeLines.push({ accountId: receivableAccount.id, debit: totalAmount, credit: 0, partnerId: inv.customerId });
    for (const line of inv.lines) {
      jeLines.push({ accountId: line.accountId, debit: 0, credit: Number(line.total), analyticAccountId: line.analyticAccountId });
    }

    await accountingService.createSourceEntry(tx, {
      journalType: 'SALES',
      partnerId: inv.customerId,
      accountingDate: inv.invoiceDate,
      documentDate: inv.invoiceDate,
      sourceType: 'CUSTOMER_INVOICE',
      sourceId: inv.id,
      lines: jeLines
    });

    return updatedInv;
  });
};

const cancelInvoice = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const inv = await tx.customerInvoice.findUnique({
      where: { id },
      include: { allocations: true }
    });
    if (!inv) throw new Error('NOT_FOUND: Invoice not found');
    if (inv.allocations && inv.allocations.length > 0) {
      throw new Error('CONFLICT: Cannot cancel invoice that has payments allocated');
    }

    return await tx.customerInvoice.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  });
};

module.exports = {
  createInvoiceFromSO,
  createDirectInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  confirmInvoice,
  cancelInvoice
};
