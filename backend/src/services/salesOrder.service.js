const prisma = require('../config/prisma');

// Utility to generate SO numbers
async function generateSONumber() {
  const latest = await prisma.salesOrder.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return 'SO/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `SO/2026/${nextNum.toString().padStart(4, '0')}`;
}

const createSO = async (userId, data) => {
  const { customerId, orderDate, lines } = data;

  // Verify customer
  const customer = await prisma.contact.findUnique({ where: { id: customerId } });
  if (!customer || customer.type !== 'CUSTOMER') {
    throw new Error('BAD_REQUEST: Invalid customer or contact type is not CUSTOMER');
  }

  return await prisma.$transaction(async (tx) => {
    const soNumber = await generateSONumber();

    // Calculate lines securely
    const computedLines = [];
    for (const line of lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) {
        throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid or inactive`);
      }

      // Respect price override if provided, else use product.salesPrice
      const unitPrice = line.unitPrice !== undefined ? line.unitPrice : product.salesPrice;
      const total = Number(line.quantity) * Number(unitPrice);

      computedLines.push({
        productId: line.productId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: Number(line.quantity),
        unitPrice: unitPrice,
        total: total
      });
    }

    const so = await tx.salesOrder.create({
      data: {
        number: soNumber,
        customerId,
        orderDate: new Date(orderDate),
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: computedLines
        }
      },
      include: { lines: true }
    });

    return so;
  });
};

const getSOs = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  return await prisma.salesOrder.findMany({
    where,
    include: { customer: true, lines: true }
  });
};

const getSOById = async (id) => {
  return await prisma.salesOrder.findUnique({
    where: { id },
    include: { customer: true, lines: { include: { product: true } }, invoices: true }
  });
};

const updateSO = async (id, data) => {
  const so = await getSOById(id);
  if (!so) throw new Error('NOT_FOUND: Sales Order not found');
  if (so.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT orders can be updated');

  // Currently we only support simple header updates for simplicity unless lines are provided
  // Note: the prompt says "Do not allow changing: customer, lines, price, quantity after confirmation". 
  // We verified it's DRAFT.
  
  const updateData = {};
  if (data.customerId) updateData.customerId = data.customerId;
  if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
  
  return await prisma.salesOrder.update({
    where: { id },
    data: updateData,
    include: { lines: true }
  });
};

const confirmSO = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id },
      include: { customer: true, lines: true }
    });
    
    if (!so) throw new Error('NOT_FOUND: Sales Order not found');
    if (so.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT orders can be confirmed');
    if (!so.customer || so.customer.type !== 'CUSTOMER') throw new Error('BAD_REQUEST: Customer is invalid');
    if (so.lines.length === 0) throw new Error('BAD_REQUEST: Cannot confirm order with no lines');

    // Check products validity
    for (const line of so.lines) {
      const p = await tx.product.findUnique({ where: { id: line.productId } });
      if (!p || !p.isActive) throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid`);
    }

    return await tx.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });
  });
};

const cancelSO = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id },
      include: { invoices: true }
    });
    if (!so) throw new Error('NOT_FOUND: Sales Order not found');
    
    // Check if invoiced
    if (so.invoices && so.invoices.length > 0) {
      throw new Error('CONFLICT: Cannot cancel an order that already has an invoice. Cancel the invoice first.');
    }

    return await tx.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  });
};

module.exports = {
  createSO,
  getSOs,
  getSOById,
  updateSO,
  confirmSO,
  cancelSO
};
