'use client';

import { useState, useCallback } from 'react';
import portalService from '@/services/portal.service';

/**
 * Statuses:
 *  idle       → button shown normally
 *  creating   → calling /payments/razorpay/order
 *  opening    → Razorpay checkout loading
 *  verifying  → calling /payments/razorpay/verify
 *  success    → payment confirmed
 *  failed     → payment failed at gateway
 *  cancelled  → user closed checkout
 *  error      → API error
 */

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({ invoice, customer, onPaymentComplete }) {
  const [status, setStatus] = useState('idle');
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const invoiceTotal = invoice?.lines?.reduce((s, l) => s + Number(l.total), 0) ?? 0;
  const paidTotal = invoice?.allocations?.reduce((s, a) => s + Number(a.allocatedAmount), 0) ?? 0;
  const amountDue = invoiceTotal - paidTotal;
  const isPaid = invoice?.status === 'PAID' || amountDue <= 0;

  const handlePay = useCallback(async () => {
    if (status !== 'idle' && status !== 'failed' && status !== 'cancelled' && status !== 'error') return;

    setErrorMessage('');
    setPaymentResult(null);
    setStatus('creating');

    let orderData;
    try {
      const res = await portalService.createRazorpayOrder(invoice.id);
      orderData = res?.data;
      if (!orderData?.razorpayOrderId) throw new Error('Invalid order data from server');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to create payment order. Please try again.');
      setStatus('error');
      return;
    }

    // Load Razorpay script (public key only)
    setStatus('opening');
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErrorMessage('Could not load Razorpay checkout. Please check your internet connection.');
      setStatus('error');
      return;
    }

    const { keyId, razorpayOrderId, amount, currency, paymentId } = orderData;

    const options = {
      key: keyId,           // Public key — safe in frontend
      order_id: razorpayOrderId,
      amount: Math.round(amount * 100), // paise
      currency: currency || 'INR',
      name: 'Urban Furniture',
      description: `Invoice ${invoice.number}`,
      ...(customer?.name && { prefill: { name: customer.name, email: customer.email || '' } }),
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
      },
      theme: { color: '#6366f1' },

      handler: async (response) => {
        // DO NOT mark invoice paid here — wait for server verification
        setStatus('verifying');
        try {
          const verifyRes = await portalService.verifyRazorpayPayment({
            paymentId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes?.success) {
            setPaymentResult({
              razorpayPaymentId: response.razorpay_payment_id,
              amount,
            });
            setStatus('success');
            if (typeof onPaymentComplete === 'function') onPaymentComplete();
          } else {
            setErrorMessage('Payment verification failed. Please contact support.');
            setStatus('failed');
          }
        } catch (err) {
          setErrorMessage(err?.message || 'Payment verification error. Please contact support.');
          setStatus('failed');
        }
      },

      modal: {
        ondismiss: () => {
          // User closed the checkout without paying
          setStatus('cancelled');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setErrorMessage(resp?.error?.description || 'Payment failed at gateway.');
        setStatus('failed');
      });
      rzp.open();
    } catch {
      setErrorMessage('Could not open Razorpay checkout.');
      setStatus('error');
    }
  }, [status, invoice, customer, onPaymentComplete]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isPaid) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-medium">
        <span className="text-xl">✓</span> Fully Paid
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="text-green-400 font-semibold text-lg">Payment Successful</p>
        <p className="text-white/70 text-sm">
          ₹{Number(paymentResult?.amount).toLocaleString('en-IN')} received
        </p>
        <p className="text-white/50 text-xs">
          Ref: {paymentResult?.razorpayPaymentId}
        </p>
        <p className="text-white/50 text-xs">Invoice: {invoice.number}</p>
      </div>
    );
  }

  const isLoading = ['creating', 'opening', 'verifying'].includes(status);
  const buttonLabel = {
    idle: `Pay ₹${Number(amountDue).toLocaleString('en-IN')}`,
    creating: 'Creating order…',
    opening: 'Opening checkout…',
    verifying: 'Verifying payment…',
    failed: `Retry ₹${Number(amountDue).toLocaleString('en-IN')}`,
    cancelled: `Pay ₹${Number(amountDue).toLocaleString('en-IN')}`,
    error: `Retry ₹${Number(amountDue).toLocaleString('en-IN')}`,
  }[status] || `Pay ₹${Number(amountDue).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-3">
      {/* Pay / Retry button */}
      <button
        onClick={handlePay}
        disabled={isLoading}
        className={[
          'w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200',
          isLoading
            ? 'bg-indigo-500/40 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg hover:shadow-indigo-500/30',
        ].join(' ')}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {buttonLabel}
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      {/* Status messages */}
      {status === 'failed' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center">
          <p className="text-red-400 font-medium text-sm">❌ Payment Failed</p>
          {errorMessage && <p className="text-red-300/70 text-xs mt-1">{errorMessage}</p>}
          <p className="text-white/50 text-xs mt-1">Your invoice remains payable. You can try again.</p>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-center">
          <p className="text-yellow-400 text-sm">Payment cancelled. Click above to try again.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center">
          <p className="text-red-400 text-sm">⚠️ {errorMessage}</p>
        </div>
      )}

      <p className="text-white/30 text-xs text-center">
        Secured by Razorpay · Payments processed in INR
      </p>
    </div>
  );
}
