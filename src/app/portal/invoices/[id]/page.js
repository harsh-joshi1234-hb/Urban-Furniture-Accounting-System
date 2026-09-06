'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import portalService from '@/services/portal.service';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import DocumentLines from '@/components/DocumentLines';
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton';
import {
  formatCurrency,
  formatDate,
  sumAllocations,
  sumLineTotals,
} from '@/utils/format';

/* ── Payment method configuration ─────────────────────────────────────── */
const PAYMENT_METHODS = [
  {
    key: 'ONLINE',
    label: 'Pay Online',
    icon: '💳',
    description: 'Instant payment via Razorpay. Your invoice is updated automatically.',
    color: '#6366f1',
    bgClass: 'pay-method-online',
  },
  {
    key: 'BANK',
    label: 'Bank Transfer',
    icon: '🏦',
    description: 'Transfer to our bank account. Share your reference for faster processing.',
    color: '#0d9488',
    bgClass: 'pay-method-bank',
  },
  {
    key: 'CASH',
    label: 'Cash',
    icon: '💵',
    description: 'Pay in person at our office. Your accountant will confirm the receipt.',
    color: '#d97706',
    bgClass: 'pay-method-cash',
  },
];

export default function PortalInvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Backend answers 404 for an invoice belonging to another customer (IDOR protection)
  const invoice = useApiResource(() => portalService.invoice(id), [id]);

  const [selectedMethod, setSelectedMethod] = useState('ONLINE');
  const [cashBankState, setCashBankState] = useState({
    status: 'idle', // idle | submitting | success | error
    message: '',
    reference: '',
    note: '',
    customAmount: '',
  });

  const handleCashBankSubmit = useCallback(async (amountDue) => {
    const amount = cashBankState.customAmount
      ? Number(cashBankState.customAmount)
      : amountDue;

    if (!amount || amount <= 0 || amount > amountDue) {
      setCashBankState((s) => ({
        ...s,
        status: 'error',
        message: `Please enter a valid amount (max ₹${amountDue.toFixed(2)}).`,
      }));
      return;
    }

    setCashBankState((s) => ({ ...s, status: 'submitting', message: '' }));

    try {
      const res = await portalService.requestPayment({
        invoiceId: id,
        amount,
        paymentMethod: selectedMethod,
        reference: cashBankState.reference || undefined,
        note: cashBankState.note || undefined,
      });
      setCashBankState((s) => ({
        ...s,
        status: 'success',
        message: res?.message || 'Payment request submitted successfully!',
      }));
      // Reload invoice to update the paid/due amounts
      invoice.reload();
    } catch (err) {
      setCashBankState((s) => ({
        ...s,
        status: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to submit payment request.',
      }));
    }
  }, [id, selectedMethod, cashBankState.customAmount, cashBankState.reference, cashBankState.note, invoice]);

  if (invoice.loading) return <Loading label="Loading invoice..." />;
  if (invoice.error) return <ErrorState error={invoice.error} onRetry={invoice.reload} />;
  if (!invoice.data) return <ErrorState error={{ status: 404, message: 'Invoice not found' }} />;

  const inv = invoice.data;
  const total = sumLineTotals(inv.lines);
  const paid = sumAllocations(inv.allocations);
  const amountDue = Math.max(total - paid, 0);
  const isPayable = inv.status === 'CONFIRMED' || inv.status === 'PARTIALLY_PAID';

  const activeMethodConfig = PAYMENT_METHODS.find((m) => m.key === selectedMethod);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={inv.number}
        subtitle={`Invoice date ${formatDate(inv.invoiceDate)}`}
        backHref="/portal/invoices"
        backLabel="My invoices"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={formatCurrency(total)} />
        <StatCard label="Paid" value={formatCurrency(paid)} tone="green" />
        <StatCard
          label="Amount Due"
          value={formatCurrency(amountDue)}
          tone={amountDue > 0 ? 'red' : 'green'}
        />
      </div>

      <Card className="mt-4" title="Invoice" actions={<Badge status={inv.status} />} bodyClassName="p-4">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Reference</dt>
            <dd className="mt-0.5 text-stone-800">{inv.invoiceReference || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Invoice Date</dt>
            <dd className="mt-0.5 text-stone-800">{formatDate(inv.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Due Date</dt>
            <dd className="mt-0.5 text-stone-800">{formatDate(inv.dueDate)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Lines" className="mt-4">
        <DocumentLines lines={inv.lines ?? []} />
      </Card>

      <Card title="Payments" className="mt-4">
        {inv.allocations?.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {inv.allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="text-sm text-stone-600">{formatDate(allocation.createdAt)}</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(allocation.allocatedAmount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-stone-500">
            No payments recorded against this invoice yet.
          </p>
        )}
      </Card>

      {/* ── Payment Section with Method Selector ──────────────────────── */}
      {isPayable && (
        <Card title="Make a Payment" className="mt-4" bodyClassName="p-0">
          {/* Method Tabs */}
          <div className="pay-method-tabs">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.key}
                type="button"
                onClick={() => {
                  setSelectedMethod(method.key);
                  setCashBankState((s) => ({ ...s, status: 'idle', message: '' }));
                }}
                className={`pay-method-tab ${selectedMethod === method.key ? 'pay-method-tab-active' : ''}`}
                style={selectedMethod === method.key ? { borderColor: method.color, color: method.color } : {}}
              >
                <span className="pay-method-tab-icon">{method.icon}</span>
                <span className="pay-method-tab-label">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Method Description */}
          <div className="pay-method-desc">
            <p className="text-sm text-stone-500">
              {activeMethodConfig?.description}
            </p>
            <p className="mt-1 text-sm">
              Amount due:{' '}
              <span className="font-semibold text-stone-800">{formatCurrency(amountDue)}</span>
            </p>
          </div>

          {/* Online (Razorpay) */}
          {selectedMethod === 'ONLINE' && (
            <div className="pay-method-body">
              <RazorpayCheckoutButton
                invoice={inv}
                customer={{ name: user?.name, email: user?.email }}
                onPaymentComplete={invoice.reload}
              />
            </div>
          )}

          {/* Cash / Bank */}
          {(selectedMethod === 'CASH' || selectedMethod === 'BANK') && (
            <div className="pay-method-body">
              {cashBankState.status === 'success' ? (
                <div className="pay-success-box">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="font-semibold text-emerald-700">Request Submitted</p>
                  <p className="text-sm text-stone-500 mt-1">{cashBankState.message}</p>
                </div>
              ) : (
                <div className="pay-form">
                  {/* Amount */}
                  <div className="pay-field">
                    <label className="pay-field-label" htmlFor="pay-amount">
                      Amount (₹)
                    </label>
                    <input
                      id="pay-amount"
                      type="number"
                      step="0.01"
                      min="1"
                      max={amountDue}
                      placeholder={amountDue.toFixed(2)}
                      value={cashBankState.customAmount}
                      onChange={(e) =>
                        setCashBankState((s) => ({ ...s, customAmount: e.target.value }))
                      }
                      className="pay-field-input"
                    />
                    <p className="pay-field-hint">
                      Leave blank to pay the full due amount of {formatCurrency(amountDue)}
                    </p>
                  </div>

                  {/* Reference (Bank only) */}
                  {selectedMethod === 'BANK' && (
                    <div className="pay-field">
                      <label className="pay-field-label" htmlFor="pay-ref">
                        Transaction / UTR Reference
                      </label>
                      <input
                        id="pay-ref"
                        type="text"
                        placeholder="e.g. UTR123456789"
                        value={cashBankState.reference}
                        onChange={(e) =>
                          setCashBankState((s) => ({ ...s, reference: e.target.value }))
                        }
                        className="pay-field-input"
                      />
                    </div>
                  )}

                  {/* Note */}
                  <div className="pay-field">
                    <label className="pay-field-label" htmlFor="pay-note">
                      Note (optional)
                    </label>
                    <textarea
                      id="pay-note"
                      rows={2}
                      placeholder="Any details for your accountant..."
                      value={cashBankState.note}
                      onChange={(e) =>
                        setCashBankState((s) => ({ ...s, note: e.target.value }))
                      }
                      className="pay-field-input"
                    />
                  </div>

                  {/* Error */}
                  {cashBankState.status === 'error' && (
                    <div className="pay-error-box">
                      ⚠️ {cashBankState.message}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={() => handleCashBankSubmit(amountDue)}
                    disabled={cashBankState.status === 'submitting'}
                    className="pay-submit-btn"
                    style={{ background: activeMethodConfig?.color }}
                  >
                    {cashBankState.status === 'submitting' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      `Submit ${selectedMethod === 'BANK' ? 'Bank Transfer' : 'Cash'} Payment Request`
                    )}
                  </button>

                  <p className="pay-disclaimer">
                    {selectedMethod === 'BANK'
                      ? '🔒 Your accountant will verify the bank transaction before confirming.'
                      : '🔒 Your accountant will confirm receipt of the cash payment.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {inv.status === 'PAID' && (
        <Card className="mt-4 border-emerald-200 bg-emerald-50">
          <div className="px-4 py-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-emerald-700">Invoice Fully Paid</p>
            <p className="text-sm text-stone-500 mt-1">Thank you for your payment</p>
          </div>
        </Card>
      )}
    </div>
  );
}
