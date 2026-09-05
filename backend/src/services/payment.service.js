const prisma = require('../config/prisma');

async function generatePaymentNumber() {
  const latest = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return 'PAY/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `PAY/2026/${nextNum.toString().padStart(4, '0')}`;
}

const createCustomerPayment = async (userId, data) => {
  const { partnerId, amount, paymentDate, paymentMethod, reference, note } = data;

  const partner = await prisma.contact.findUnique({ where: { id: partnerId } });
  if (!partner || partner.type !== 'CUSTOMER') {
    throw new Error('BAD_REQUEST: Partner must be a valid CUSTOMER');
  }

  const payNumber = await generatePaymentNumber();

  return await prisma.payment.create({
    data: {
      number: payNumber,
      paymentType: 'RECEIVE',
      partnerType: 'CUSTOMER',
      partnerId,
      amount: Number(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      reference,
      note,
      status: 'CONFIRMED', // Direct confirmation for simplicity in this phase unless DRAFT is required
      createdBy: userId
    }
  });
};

const allocatePayment = async (userId, paymentId, data) => {
  const { documentType, customerInvoiceId, allocatedAmount } = data;

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { allocations: true }
    });

    if (!payment) throw new Error('NOT_FOUND: Payment not found');
    if (payment.paymentType !== 'RECEIVE') throw new Error('BAD_REQUEST: Payment must be RECEIVE');

    const invoice = await tx.customerInvoice.findUnique({
      where: { id: customerInvoiceId },
      include: { allocations: true, lines: true }
    });

    if (!invoice) throw new Error('NOT_FOUND: Invoice not found');
    if (invoice.customerId !== payment.partnerId) throw new Error('BAD_REQUEST: Invoice customer does not match payment partner');
    if (invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') throw new Error('BAD_REQUEST: Invoice is not in a valid status for payment');

    const totalAllocatedFromPayment = payment.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const paymentRemaining = Number(payment.amount) - totalAllocatedFromPayment;

    if (Number(allocatedAmount) > paymentRemaining) {
      throw new Error('BAD_REQUEST: Allocated amount exceeds payment remaining amount');
    }

    const invoiceTotal = invoice.lines.reduce((sum, line) => sum + Number(line.total), 0);
    const totalAllocatedToInvoice = invoice.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const invoiceRemaining = invoiceTotal - totalAllocatedToInvoice;

    if (Number(allocatedAmount) > invoiceRemaining) {
      throw new Error('BAD_REQUEST: Allocated amount exceeds invoice remaining balance');
    }

    const allocation = await tx.paymentAllocation.create({
      data: {
        paymentId,
        documentType: 'CUSTOMER_INVOICE',
        customerInvoiceId,
        allocatedAmount: Number(allocatedAmount)
      }
    });

    // Update invoice status based on new allocations
    const newAllocatedToInvoice = totalAllocatedToInvoice + Number(allocatedAmount);
    let newStatus = invoice.status;
    
    // Allow small floating errors in JS by using an epsilon or just round
    // We will just do a standard equality check for simplicity, but in production we'd use Decimal
    if (newAllocatedToInvoice >= invoiceTotal) {
      newStatus = 'PAID';
    } else if (newAllocatedToInvoice > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    if (newStatus !== invoice.status) {
      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { status: newStatus }
      });
    }

    return allocation;
  });
};

module.exports = {
  createCustomerPayment,
  allocatePayment
};
