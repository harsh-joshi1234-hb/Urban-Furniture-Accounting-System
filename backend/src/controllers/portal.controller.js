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

const initiatePortalPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount } = req.body;
    const customerIds = await getUserCustomers(req.user.id);

    const invoice = await prisma.customerInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || !customerIds.includes(invoice.customerId)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Create a PaymentGatewayTransaction placeholder
    // Full Razorpay is in a later phase.
    const transaction = await prisma.paymentGatewayTransaction.create({
      data: {
        // Mock a pending internal payment record for the portal
        payment: {
          create: {
            number: `ONL/${Date.now()}`,
            paymentType: 'RECEIVE',
            partnerType: 'CUSTOMER',
            partnerId: invoice.customerId,
            amount: Number(amount),
            paymentDate: new Date(),
            paymentMethod: 'ONLINE',
            status: 'DRAFT',
            createdBy: req.user.id
          }
        },
        provider: 'RAZORPAY',
        providerOrderId: `order_${Date.now()}`,
        amount: Number(amount)
      }
    });

    res.status(201).json({ success: true, message: 'Payment initiated', data: transaction });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPortalInvoices, getPortalInvoiceById, initiatePortalPayment };
