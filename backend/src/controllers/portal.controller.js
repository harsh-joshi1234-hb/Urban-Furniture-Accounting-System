const prisma = require('../config/prisma');
const { getUserCustomers } = require('../services/customerOwnership.service');

const getPortalInvoices = async (req, res, next) => {
  try {
    const customerIds = await getUserCustomers(req.user.id);
    if (customerIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const invoices = await prisma.customerInvoice.findMany({
      where: {
        customerId: { in: customerIds },
        status: { not: 'DRAFT' } // Usually portal users don't see drafts
      },
      include: { lines: true }
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

const getPortalInvoiceById = async (req, res, next) => {
  try {
    const customerIds = await getUserCustomers(req.user.id);
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { product: true } }, allocations: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // IDOR Protection Check
    if (!customerIds.includes(invoice.customerId)) {
      // Return 404 to avoid leaking existence of other customer's invoices
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * Portal payment request. Supports CASH, BANK, and ONLINE methods.
 * - CASH / BANK: Creates a DRAFT payment + allocation for admin to confirm.
 * - ONLINE: Creates a pending gateway transaction record (Razorpay flow handled separately).
 */
const initiatePortalPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod = 'CASH', reference, note } = req.body;

    // Validate payment method
    const validMethods = ['CASH', 'BANK', 'ONLINE'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method. Use CASH, BANK, or ONLINE.' });
    }

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice ID and a positive amount are required.' });
    }

    const customerIds = await getUserCustomers(req.user.id);
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { allocations: true, lines: true }
    });

    if (!invoice || !customerIds.includes(invoice.customerId)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check the invoice is payable
    if (invoice.status !== 'CONFIRMED' && invoice.status !== 'PARTIALLY_PAID') {
      return res.status(400).json({ success: false, message: 'This invoice cannot accept payments in its current status.' });
    }

    // Calculate amount due
    const invoiceTotal = invoice.lines.reduce((sum, l) => sum + Number(l.total), 0);
    const paidSoFar = invoice.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const amountDue = invoiceTotal - paidSoFar;

    if (Number(amount) > amountDue) {
      return res.status(400).json({ success: false, message: `Amount exceeds the due balance of ₹${amountDue.toFixed(2)}.` });
    }

    // Generate payment number
    const year = new Date().getFullYear();
    const count = await prisma.payment.count({
      where: { number: { startsWith: `PAY/${year}/` } }
    });
    const paymentNumber = `PAY/${year}/${String(count + 1).padStart(4, '0')}`;

    if (paymentMethod === 'ONLINE') {
      // Online method: create a gateway transaction placeholder (for Razorpay flow)
      const transaction = await prisma.paymentGatewayTransaction.create({
        data: {
          payment: {
            create: {
              number: paymentNumber,
              paymentType: 'RECEIVE',
              partnerType: 'CUSTOMER',
              partnerId: invoice.customerId,
              amount: Number(amount),
              paymentDate: new Date(),
              paymentMethod: 'ONLINE',
              status: 'DRAFT',
              reference: reference || null,
              note: note || 'Payment initiated from customer portal',
              createdBy: req.user.id
            }
          },
          provider: 'RAZORPAY',
          providerOrderId: `order_${Date.now()}`,
          amount: Number(amount)
        }
      });
      return res.status(201).json({ success: true, message: 'Online payment initiated', data: transaction });
    }

    // CASH / BANK: Create a DRAFT payment + allocation. Admin must confirm later.
    const payment = await prisma.payment.create({
      data: {
        number: paymentNumber,
        paymentType: 'RECEIVE',
        partnerType: 'CUSTOMER',
        partnerId: invoice.customerId,
        amount: Number(amount),
        paymentDate: new Date(),
        paymentMethod: paymentMethod, // CASH or BANK
        status: 'DRAFT',
        reference: reference || null,
        note: note || `${paymentMethod} payment request from customer portal. Pending admin confirmation.`,
        createdBy: req.user.id,
        allocations: {
          create: {
            documentType: 'CUSTOMER_INVOICE',
            customerInvoiceId: invoiceId,
            allocatedAmount: Number(amount),
          }
        }
      },
      include: { allocations: true }
    });

    return res.status(201).json({
      success: true,
      message: `${paymentMethod} payment request submitted. Your accountant will verify and confirm.`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPortalInvoices, getPortalInvoiceById, initiatePortalPayment };
