const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance = null;

const getInstance = () => {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing');
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

/**
 * Creates a new Razorpay order.
 * @param {number} amountInRupees - The amount in INR (rupees).
 * @param {string} receiptReference - Internal reference ID (e.g., invoice number or payment ID).
 * @param {Object} notes - Optional metadata.
 * @returns {Promise<Object>} The created Razorpay order object.
 */
const createOrder = async (amountInRupees, receiptReference, notes = {}) => {
  try {
    const rzp = getInstance();
    const amountInPaise = Math.round(Number(amountInRupees) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptReference,
      notes,
    };

    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error('FAILED_DEPENDENCY: Could not generate payment gateway order');
  }
};

/**
 * Verifies the Razorpay payment signature from the checkout response.
 * Uses RAZORPAY_KEY_SECRET (never sent to frontend).
 * razorpay_order_id + "|" + razorpay_payment_id, signed with KEY_SECRET
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 * @returns {boolean}
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const sigBuffer = Buffer.from(razorpaySignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, sigBuffer);
  } catch {
    return false;
  }
};

/**
 * Verifies a Razorpay webhook signature.
 * @param {Buffer} rawBody - Raw request body buffer (must not be JSON-parsed yet).
 * @param {string} signature - X-Razorpay-Signature header value.
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || secret === 'your_webhook_secret_here') {
      console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting webhook.');
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, sigBuffer);
  } catch {
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
