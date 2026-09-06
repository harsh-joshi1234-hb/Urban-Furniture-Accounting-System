const prisma = require('../config/prisma');
const accountingService = require('./accounting.service');
const razorpayService = require('./razorpay.service');
const customerOwnershipService = require('./customerOwnership.service');
const auditService = require('./audit.service');

async function generatePaymentNumber() {
  const latest = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return 'PAY/2026/0001';
  
  const lastNumStr = latest.number.split('/').pop();
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `PAY/2026/${nextNum.toString().padStart(4, '0')}`;
}

const listPayments = async () => {
  return await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { partner: true, allocations: true },
    take: 50
  });
};

const createPayment = async (userId, data) => {
  const { partnerId, paymentType, partnerType, amount, paymentDate, paymentMethod, reference, note } = data;

  const partner = await prisma.contact.findUnique({ where: { id: partnerId } });
  if (!partner || partner.type !== partnerType) {
    throw new Error(`BAD_REQUEST: Partner must be a valid ${partnerType}`);
  }

  // Double check the exact mapping just in case
  if (paymentType === 'RECEIVE' && partnerType !== 'CUSTOMER') throw new Error('BAD_REQUEST: RECEIVE must be for a CUSTOMER');
  if (paymentType === 'SEND' && partnerType !== 'VENDOR') throw new Error('BAD_REQUEST: SEND must be for a VENDOR');

  return await prisma.$transaction(async (tx) => {
    const payNumber = await generatePaymentNumber();

    const payment = await tx.payment.create({
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

    const paymentAccount = await tx.chartOfAccount.findUnique({ where: { code: '100000' } });
    if (!paymentAccount) throw new Error('BAD_REQUEST: Bank account 100000 not found');

    const jeLines = [];
    if (paymentType === 'RECEIVE') {
      const receivableAccount = await tx.chartOfAccount.findUnique({ where: { code: '120000' } });
      jeLines.push({ accountId: paymentAccount.id, debit: Number(amount), credit: 0 });
      jeLines.push({ accountId: receivableAccount.id, debit: 0, credit: Number(amount), partnerId });
    } else {
      const payableAccount = await tx.chartOfAccount.findUnique({ where: { code: '210000' } });
      jeLines.push({ accountId: payableAccount.id, debit: Number(amount), credit: 0, partnerId });
      jeLines.push({ accountId: paymentAccount.id, debit: 0, credit: Number(amount) });
    }

    await accountingService.createSourceEntry(tx, {
      journalType: 'BANK',
      partnerId,
      accountingDate: payment.paymentDate,
      documentDate: payment.paymentDate,
      sourceType: paymentType === 'RECEIVE' ? 'CUSTOMER_PAYMENT' : 'VENDOR_PAYMENT',
      sourceId: payment.id,
      lines: jeLines
    });

    return payment;
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

const createRazorpayOrder = async (userId, data) => {
  const { invoiceId } = data;

  const invoice = await prisma.customerInvoice.findUnique({
    where: { id: invoiceId },
    include: { allocations: true, lines: true }
  });

  if (!invoice) throw new Error('NOT_FOUND: Invoice not found');

  const customerIds = await customerOwnershipService.getUserCustomers(userId);
  if (!customerIds.includes(invoice.customerId)) {
    throw new Error('NOT_FOUND: Invoice not found'); // Avoid leaking existence
  }

  if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
    throw new Error('BAD_REQUEST: Invoice is not in a valid payable status');
  }

  const invoiceTotal = invoice.lines.reduce((sum, line) => sum + Number(line.total), 0);
  const paidTotal = invoice.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
  const amountDue = invoiceTotal - paidTotal;

  if (amountDue <= 0) {
    throw new Error('BAD_REQUEST: Invalid or zero payable amount');
  }

  // Deduplication check: check if a pending transaction already exists
  const existingTxn = await prisma.paymentGatewayTransaction.findFirst({
    where: {
      provider: 'RAZORPAY',
      status: 'PENDING',
      payment: {
        paymentMethod: 'ONLINE',
        status: 'DRAFT',
        reference: invoiceId
      }
    },
    include: { payment: true }
  });

  if (existingTxn && Number(existingTxn.amount) === amountDue) {
    return {
      paymentId: existingTxn.paymentId,
      razorpayOrderId: existingTxn.providerOrderId,
      amount: amountDue,
      currency: existingTxn.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  }

  return await prisma.$transaction(async (tx) => {
    const payNumber = await generatePaymentNumber();

    const payment = await tx.payment.create({
      data: {
        number: payNumber,
        paymentType: 'RECEIVE',
        partnerType: 'CUSTOMER',
        partnerId: invoice.customerId,
        amount: amountDue,
        paymentDate: new Date(),
        paymentMethod: 'ONLINE',
        reference: invoiceId,
        status: 'DRAFT',
        createdBy: userId
      }
    });

    const rzpOrder = await razorpayService.createOrder(amountDue, payment.number);

    await tx.paymentGatewayTransaction.create({
      data: {
        paymentId: payment.id,
        provider: 'RAZORPAY',
        providerOrderId: rzpOrder.id,
        amount: amountDue,
        currency: 'INR',
        status: 'PENDING'
      }
    });

    return {
      paymentId: payment.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountDue,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    };
  });
};

// ---------------------------------------------------------------------------
// INTERNAL HELPER: confirm a gateway payment (used by verify + webhook)
// ---------------------------------------------------------------------------

async function _confirmGatewayPayment(tx, { txn, razorpayPaymentId, invoiceId }) {
  // Idempotency: already processed → return early
  if (txn.status === 'SUCCESS') {
    return { alreadyProcessed: true };
  }

  // Update gateway transaction
  await tx.paymentGatewayTransaction.update({
    where: { id: txn.id },
    data: {
      providerTransactionId: razorpayPaymentId,
      status: 'SUCCESS',
      completedAt: new Date()
    }
  });

  // Confirm the internal Payment
  const payment = await tx.payment.update({
    where: { id: txn.paymentId },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
    include: { allocations: true }
  });

  // Allocate to invoice (idempotency: skip if already allocated to same invoice)
  const existingAlloc = payment.allocations.find(
    a => a.customerInvoiceId === invoiceId && a.documentType === 'CUSTOMER_INVOICE'
  );

  if (!existingAlloc) {
    const invoice = await tx.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { allocations: true, lines: true }
    });
    if (!invoice) throw new Error('NOT_FOUND: Invoice not found during confirmation');

    const invoiceTotal = invoice.lines.reduce((sum, l) => sum + Number(l.total), 0);
    const alreadyPaid = invoice.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const toAllocate = Math.min(Number(payment.amount), invoiceTotal - alreadyPaid);

    if (toAllocate > 0) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          documentType: 'CUSTOMER_INVOICE',
          customerInvoiceId: invoiceId,
          allocatedAmount: toAllocate
        }
      });

      const newPaidTotal = alreadyPaid + toAllocate;
      const newStatus = newPaidTotal >= invoiceTotal ? 'PAID' : 'PARTIALLY_PAID';
      await tx.customerInvoice.update({ where: { id: invoiceId }, data: { status: newStatus } });
    }
  }

  // Create accounting entry (idempotent — skips if CUSTOMER_PAYMENT+sourceId already has a POSTED entry)
  const bankAccount = await tx.chartOfAccount.findUnique({ where: { code: '100000' } });
  const receivableAccount = await tx.chartOfAccount.findUnique({ where: { code: '120000' } });

  if (!bankAccount) throw new Error('BAD_REQUEST: Bank account 100000 not found');
  if (!receivableAccount) throw new Error('BAD_REQUEST: Accounts Receivable 120000 not found');

  await accountingService.createSourceEntry(tx, {
    journalType: 'BANK',
    partnerId: payment.partnerId,
    accountingDate: new Date(),
    documentDate: new Date(),
    sourceType: 'CUSTOMER_PAYMENT',
    sourceId: payment.id,
    lines: [
      { accountId: bankAccount.id, debit: Number(payment.amount), credit: 0 },
      { accountId: receivableAccount.id, debit: 0, credit: Number(payment.amount), partnerId: payment.partnerId }
    ]
  });

  return { alreadyProcessed: false, paymentId: payment.id };
}

// ---------------------------------------------------------------------------
// VERIFY — called after Razorpay Checkout returns success to the frontend
// ---------------------------------------------------------------------------

const verifyRazorpayPayment = async (userId, data) => {
  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

  // Load the gateway transaction
  const txn = await prisma.paymentGatewayTransaction.findFirst({
    where: { paymentId, provider: 'RAZORPAY' },
    include: { payment: true }
  });
  if (!txn) throw new Error('NOT_FOUND: Gateway transaction not found');

  // Ownership check — the requesting user must own the payment's customer
  const customerIds = await customerOwnershipService.getUserCustomers(userId);
  if (!customerIds.includes(txn.payment.partnerId)) {
    throw new Error('NOT_FOUND: Payment not found');
  }

  // Verify stored Razorpay order ID matches
  if (txn.providerOrderId !== razorpayOrderId) {
    throw new Error('BAD_REQUEST: Razorpay order ID mismatch');
  }

  // Verify HMAC signature server-side — never trust frontend success flag
  const signatureValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId, razorpayPaymentId, razorpaySignature
  );
  if (!signatureValid) {
    throw new Error('BAD_REQUEST: PAYMENT_SIGNATURE_INVALID');
  }

  // Find the invoice this payment is for (stored as reference at order creation)
  const invoiceId = txn.payment.reference;
  if (!invoiceId) throw new Error('BAD_REQUEST: Payment has no invoice reference');

  // Confirm in a transaction (idempotent)
  return await prisma.$transaction(async (tx) => {
    const result = await _confirmGatewayPayment(tx, { txn, razorpayPaymentId, invoiceId });

    if (!result.alreadyProcessed) {
      await auditService.log({
        userId,
        entityType: 'Payment',
        entityId: txn.paymentId,
        action: 'RAZORPAY_PAYMENT_VERIFIED',
        newValues: { razorpayPaymentId, razorpayOrderId }
      });
    }

    return { success: true, paymentId: txn.paymentId, alreadyProcessed: result.alreadyProcessed };
  });
};

// ---------------------------------------------------------------------------
// WEBHOOK — called by Razorpay's servers directly (no JWT auth)
// ---------------------------------------------------------------------------

const handleRazorpayWebhook = async (rawBody, signature) => {
  // Verify webhook signature — do NOT process without valid signature
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    throw new Error('UNAUTHORIZED: Invalid webhook signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    throw new Error('BAD_REQUEST: Could not parse webhook body');
  }

  const eventType = event.event;
  console.log(`[Razorpay Webhook] Received event: ${eventType}`);

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const paymentPayload = event.payload?.payment?.entity;
    const orderPayload = event.payload?.order?.entity;
    const rzpOrderId = paymentPayload?.order_id || orderPayload?.id;
    const rzpPaymentId = paymentPayload?.id;

    if (!rzpOrderId || !rzpPaymentId) {
      console.warn('[Razorpay Webhook] Missing order/payment IDs in payload');
      return { processed: false };
    }

    const txn = await prisma.paymentGatewayTransaction.findFirst({
      where: { providerOrderId: rzpOrderId, provider: 'RAZORPAY' },
      include: { payment: true }
    });

    if (!txn) {
      console.warn(`[Razorpay Webhook] No transaction for orderId=${rzpOrderId}`);
      return { processed: false };
    }

    const invoiceId = txn.payment.reference;
    if (!invoiceId) {
      console.warn('[Razorpay Webhook] Payment has no invoice reference');
      return { processed: false };
    }

    await prisma.$transaction(async (tx) => {
      await _confirmGatewayPayment(tx, { txn, razorpayPaymentId: rzpPaymentId, invoiceId });
    });

    console.log(`[Razorpay Webhook] Processed ${eventType} for orderId=${rzpOrderId}`);
    return { processed: true };
  }

  if (eventType === 'payment.failed') {
    const paymentPayload = event.payload?.payment?.entity;
    const rzpOrderId = paymentPayload?.order_id;
    const failureReason = paymentPayload?.error_description || 'Payment failed';

    if (!rzpOrderId) {
      console.warn('[Razorpay Webhook] Missing order ID in failed payment payload');
      return { processed: false };
    }

    const txn = await prisma.paymentGatewayTransaction.findFirst({
      where: { providerOrderId: rzpOrderId, provider: 'RAZORPAY' }
    });

    if (!txn) {
      console.warn(`[Razorpay Webhook] No transaction for failed orderId=${rzpOrderId}`);
      return { processed: false };
    }

    if (txn.status === 'PENDING') {
      await prisma.paymentGatewayTransaction.update({
        where: { id: txn.id },
        data: {
          status: 'FAILED',
          failureReason: failureReason.substring(0, 500),
          completedAt: new Date()
        }
      });
    }

    return { processed: true };
  }

  console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
  return { processed: false, reason: 'unhandled_event' };
};

module.exports = {
  listPayments,
  createPayment,
  allocatePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
};
