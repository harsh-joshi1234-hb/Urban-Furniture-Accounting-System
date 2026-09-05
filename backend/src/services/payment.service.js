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

const createPayment = async (userId, data) => {
  const { partnerId, paymentType, partnerType, amount, paymentDate, paymentMethod, reference, note } = data;

  const partner = await prisma.contact.findUnique({ where: { id: partnerId } });
  if (!partner || partner.type !== partnerType) {
    throw new Error(`BAD_REQUEST: Partner must be a valid ${partnerType}`);
  }

  // Double check the exact mapping just in case
  if (paymentType === 'RECEIVE' && partnerType !== 'CUSTOMER') throw new Error('BAD_REQUEST: RECEIVE must be for a CUSTOMER');
  if (paymentType === 'SEND' && partnerType !== 'VENDOR') throw new Error('BAD_REQUEST: SEND must be for a VENDOR');

  const payNumber = await generatePaymentNumber();

  return await prisma.payment.create({
    data: {
      number: payNumber,
      paymentType,
      partnerType,
      partnerId,
      amount: Number(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      reference,
      note,
      status: 'CONFIRMED', 
      createdBy: userId
    }
  });
};

const allocatePayment = async (userId, paymentId, data) => {
  const { documentType, customerInvoiceId, vendorBillId, allocatedAmount } = data;

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { allocations: true }
    });

    if (!payment) throw new Error('NOT_FOUND: Payment not found');

    // Reject cross-type operations early
    if (payment.paymentType === 'RECEIVE' && documentType !== 'CUSTOMER_INVOICE') {
      throw new Error('BAD_REQUEST: RECEIVE payment can only be allocated to CUSTOMER_INVOICE');
    }
    if (payment.paymentType === 'SEND' && documentType !== 'VENDOR_BILL') {
      throw new Error('BAD_REQUEST: SEND payment can only be allocated to VENDOR_BILL');
    }

    let documentTotal = 0;
    let totalAllocatedToDocument = 0;
    let documentId = null;
    let documentStatus = null;
    let documentUpdateMethod = null;

    if (documentType === 'CUSTOMER_INVOICE') {
      const invoice = await tx.customerInvoice.findUnique({
        where: { id: customerInvoiceId },
        include: { allocations: true, lines: true }
      });
      if (!invoice) throw new Error('NOT_FOUND: Invoice not found');
      if (invoice.customerId !== payment.partnerId) throw new Error('BAD_REQUEST: Invoice customer does not match payment partner');
      if (invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') throw new Error('BAD_REQUEST: Invoice is not in a valid status for payment');

      documentTotal = invoice.lines.reduce((sum, line) => sum + Number(line.total), 0);
      totalAllocatedToDocument = invoice.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
      documentId = invoice.id;
      documentStatus = invoice.status;
      documentUpdateMethod = tx.customerInvoice;
    } else if (documentType === 'VENDOR_BILL') {
      const bill = await tx.vendorBill.findUnique({
        where: { id: vendorBillId },
        include: { allocations: true, lines: true }
      });
      if (!bill) throw new Error('NOT_FOUND: Bill not found');
      if (bill.vendorId !== payment.partnerId) throw new Error('BAD_REQUEST: Bill vendor does not match payment partner');
      if (bill.status === 'CANCELLED' || bill.status === 'DRAFT') throw new Error('BAD_REQUEST: Bill is not in a valid status for payment');

      documentTotal = bill.lines.reduce((sum, line) => sum + Number(line.total), 0);
      totalAllocatedToDocument = bill.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
      documentId = bill.id;
      documentStatus = bill.status;
      documentUpdateMethod = tx.vendorBill;
    }

    const totalAllocatedFromPayment = payment.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const paymentRemaining = Number(payment.amount) - totalAllocatedFromPayment;

    if (Number(allocatedAmount) > paymentRemaining) {
      throw new Error('BAD_REQUEST: Allocated amount exceeds payment remaining amount');
    }

    const documentRemaining = documentTotal - totalAllocatedToDocument;

    if (Number(allocatedAmount) > documentRemaining) {
      throw new Error('BAD_REQUEST: Allocated amount exceeds document remaining balance');
    }

    const allocation = await tx.paymentAllocation.create({
      data: {
        paymentId,
        documentType,
        customerInvoiceId: documentType === 'CUSTOMER_INVOICE' ? documentId : null,
        vendorBillId: documentType === 'VENDOR_BILL' ? documentId : null,
        allocatedAmount: Number(allocatedAmount)
      }
    });

    const newAllocatedToDocument = totalAllocatedToDocument + Number(allocatedAmount);
    let newStatus = documentStatus;
    
    if (newAllocatedToDocument >= documentTotal) {
      newStatus = 'PAID';
    } else if (newAllocatedToDocument > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    if (newStatus !== documentStatus) {
      await documentUpdateMethod.update({
        where: { id: documentId },
        data: { status: newStatus }
      });
    }

    return allocation;
  });
};

module.exports = {
  createPayment,
  allocatePayment
};
