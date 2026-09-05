import api from '@/lib/apiClient';

/** Customer portal. The backend enforces ownership on every one of these. */
export const portalService = {
  invoices: () => api.get('/portal/invoices'),
  invoice: (id) => api.get(`/portal/invoices/${id}`),

  /** Step 1: Create a Razorpay order for a specific invoice. Returns razorpayOrderId, amount, keyId. */
  createRazorpayOrder: (invoiceId) =>
    api.post('/payments/razorpay/order', { invoiceId }),

  /**
   * Step 2: Verify the Razorpay payment on the server after checkout completes.
   * The server verifies the HMAC signature and creates the accounting entries.
   */
  verifyRazorpayPayment: ({ paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) =>
    api.post('/payments/razorpay/verify', {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }),
};

export default portalService;
