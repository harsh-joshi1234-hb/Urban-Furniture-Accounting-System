'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import portalService from '@/services/portal.service';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import DocumentLines from '@/components/DocumentLines';
import { TextField } from '@/components/ui/Field';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import {
  formatCurrency,
  formatDate,
  sumAllocations,
  sumLineTotals,
} from '@/utils/format';

export default function PortalInvoiceDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(null);

  // The backend answers 404 for an invoice that belongs to another customer.
  const invoice = useApiResource(() => portalService.invoice(id), [id]);

  const pay = useSubmit(() => portalService.initiatePayment(id, Number(amount)), {
    onSuccess: () => {
      setPayOpen(false);
      setAmount('');
      toast.success('Payment initiated. It will show once the provider confirms it.');
      invoice.reload();
    },
  });

  if (invoice.loading) return <Loading label="Loading invoice..." />;
  if (invoice.error) return <ErrorState error={invoice.error} onRetry={invoice.reload} />;
  if (!invoice.data) return <ErrorState error={{ status: 404, message: 'Invoice not found' }} />;

  const inv = invoice.data;
  const total = sumLineTotals(inv.lines);
  const paid = sumAllocations(inv.allocations);
  const amountDue = Math.max(total - paid, 0);

  const onPay = (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }
    if (value > amountDue) {
      setAmountError(`Cannot exceed the amount due (${formatCurrency(amountDue)})`);
      return;
    }
    setAmountError(null);
    pay.submit();
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={inv.number}
        subtitle={`Invoice date ${formatDate(inv.invoiceDate)}`}
        backHref="/portal/invoices"
        backLabel="My invoices"
        actions={
          amountDue > 0 ? <Button onClick={() => setPayOpen(true)}>Pay now</Button> : null
        }
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
            <dt className="text-xs uppercase tracking-wide text-slate-500">Reference</dt>
            <dd className="mt-0.5 text-slate-800">{inv.invoiceReference || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Invoice Date</dt>
            <dd className="mt-0.5 text-slate-800">{formatDate(inv.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Due Date</dt>
            <dd className="mt-0.5 text-slate-800">{formatDate(inv.dueDate)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Lines" className="mt-4">
        <DocumentLines lines={inv.lines ?? []} />
      </Card>

      <Card title="Payments" className="mt-4">
        {inv.allocations?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {inv.allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="text-sm text-slate-600">{formatDate(allocation.createdAt)}</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(allocation.allocatedAmount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No payments recorded against this invoice yet.
          </p>
        )}
      </Card>

      <Modal
        open={payOpen}
        onClose={pay.submitting ? undefined : () => setPayOpen(false)}
        title="Pay this invoice"
        description={`Amount due ${formatCurrency(amountDue)}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPayOpen(false)}
              disabled={pay.submitting}
            >
              Cancel
            </Button>
            <Button onClick={onPay} loading={pay.submitting}>
              Continue to payment
            </Button>
          </>
        }
      >
        <form onSubmit={onPay} className="space-y-4" noValidate>
          <FormError error={pay.error} />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            error={amountError}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            onClick={() => setAmount(String(amountDue))}
          >
            Pay full amount due
          </button>
          <p className="text-xs text-slate-500">
            The payment is handled by the payment provider. Your invoice status updates once
            the provider confirms it.
          </p>
        </form>
      </Modal>
    </div>
  );
}
