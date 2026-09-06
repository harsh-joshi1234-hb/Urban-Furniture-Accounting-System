const prisma = require('../config/prisma');

async function generatePONumber() {
  const latest = await prisma.purchaseOrder.findFirst({
    orderBy: { number: 'desc' }
  });
  if (!latest) return 'PO/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `PO/2026/${nextNum.toString().padStart(4, '0')}`;
}

const createPO = async (userId, data) => {
  const { vendorId, orderDate, lines } = data;

  const vendor = await prisma.contact.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.type !== 'VENDOR') {
    throw new Error('BAD_REQUEST: Invalid vendor or contact type is not VENDOR');
  }

  return await prisma.$transaction(async (tx) => {
    const poNumber = await generatePONumber();

    const computedLines = [];
    for (const line of lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) {
        throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid or inactive`);
      }

      // Use Product.cost if unitPrice is not overridden
      const unitPrice = line.unitPrice !== undefined ? line.unitPrice : product.cost;
      const total = Number(line.quantity) * Number(unitPrice);

      computedLines.push({
        productId: line.productId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: Number(line.quantity),
        unitPrice: unitPrice,
        total: total
      });
    }

    return await tx.purchaseOrder.create({
      data: {
        number: poNumber,
        vendorId,
        orderDate: new Date(orderDate),
        status: 'DRAFT',
        createdBy: userId,
        lines: { create: computedLines }
      },
      include: { lines: true }
    });
  });
};

const getPOs = async (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  return await prisma.purchaseOrder.findMany({
    where,
    include: { vendor: true, lines: true, bills: true }
  });
};

const getPOById = async (id) => {
  return await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, lines: { include: { product: true } }, bills: true }
  });
};

const updatePO = async (id, data) => {
  const po = await getPOById(id);
  if (!po) throw new Error('NOT_FOUND: Purchase Order not found');
  if (po.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT orders can be updated');

  const updateData = {};
  if (data.vendorId) updateData.vendorId = data.vendorId;
  if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
  
  return await prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: { lines: true }
  });
};

const confirmPO = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true, lines: true }
    });
    
    if (!po) throw new Error('NOT_FOUND: Purchase Order not found');
    if (po.status !== 'DRAFT') throw new Error('CONFLICT: Only DRAFT orders can be confirmed');
    if (!po.vendor || po.vendor.type !== 'VENDOR') throw new Error('BAD_REQUEST: Vendor is invalid');
    if (po.lines.length === 0) throw new Error('BAD_REQUEST: Cannot confirm order with no lines');

    for (const line of po.lines) {
      const p = await tx.product.findUnique({ where: { id: line.productId } });
      if (!p || !p.isActive) throw new Error(`BAD_REQUEST: Product ${line.productId} is invalid`);
    }

    return await tx.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });
  });
};

const cancelPO = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { bills: true }
    });
    if (!po) throw new Error('NOT_FOUND: Purchase Order not found');
    
    if (po.bills && po.bills.length > 0) {
      throw new Error('CONFLICT: Cannot cancel an order that already has a vendor bill.');
    }

    return await tx.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  });
};

module.exports = {
  createPO,
  getPOs,
  getPOById,
  updatePO,
  confirmPO,
  cancelPO
};
