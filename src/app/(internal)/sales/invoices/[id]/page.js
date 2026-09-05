'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { invoiceService } from '@/services/sales.service';
import analyticAccountService from '@/services/analytic.service';
import { accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DocumentLines from '@/components/DocumentLines';
import PaymentDialog from '@/components/forms/PaymentDialog';
import { TextField } from '@/components/ui/Field';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import {
  formatCurrency,
  formatDate,
  sumAllocations,
  sumLineTotals,
  toDateInput,
} from '@/utils/format';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ invoiceReference: '', invoiceDate: '', dueDate: '' });

  const invoice = useApiResource(() => invoiceService.get(id), [id]);
  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const accounts = useApiResource(() => accountService.list(), []);

  const confirmInvoice = useSubmit(() => invoiceService.confirm(id), {
    onSuccess: () => {
      toast.success('Invoice confirmed and journal entry posted');
      setConfirmAction(null);
      invoice.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelInvoice = useSubmit(() => invoiceService.cancel(id), {
    onSuccess: () => {
      toast.success('Invoice cancelled');
      setConfirmAction(null);
      invoice.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const saveHeader = useSubmit(
    () =>
      invoiceService.update(id, {
        invoiceReference: draft.invoiceReference || undefined,
        invoiceDate: draft.invoiceDate,
        dueDate: draft.dueDate,
      }),
    {
      onSuccess: () => {
        toast.success('Invoice updated');
        setEditing(false);
        invoice.reload();
      },
    },
  );

  if (invoice.loading) return <Loading label="Loading invoice..." />;
  if (invoice.error) return <ErrorState error={invoice.error} onRetry={invoice.reload} />;
  if (!invoice.data) return <ErrorState error={{ status: 404, message: 'Invoice not found' }} />;

  const inv = invoice.data;
  const total = sumLineTotals(inv.lines);
  const paid = sumAllocations(inv.allocations);
  const amountDue = Math.max(total - paid, 0);
  const isDraft = inv.status === 'DRAFT';
  const canPay = ['CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status) && amountDue > 0;

  const startEdit = () => {
    setDraft({
      invoiceReference: inv.invoiceReference || '',
      invoiceDate: toDateInput(inv.invoiceDate),
      dueDate: toDateInput(inv.dueDate),
    });
    setEditing(true);
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={inv.number}
        subtitle={`${inv.customer?.name || ''} - ${formatDate(inv.invoiceDate)}`}
        backHref="/sales/invoices"
        backLabel="Invoices"
        actions={
          <>
            {inv.salesOrderId && (
              <Link href={`/sales/orders/${inv.salesOrderId}`}>
                <Button variant="secondary">SO</Button>
              </Link>
            )}
            {isDraft && !editing && (
              <Button variant="secondary" onClick={startEdit}>
                Edit
              </Button>
            )}
            {isDraft && (
              <Button variant="success" onClick={() => setConfirmAction('confirm')}>
                Confirm
              </Button>
            )}
            {canPay && <Button onClick={() => setPayOpen(true)}>Pay</Button>}
            {!['CANCELLED', 'PAID'].includes(inv.status) && (
              <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={formatCurrency(total)} />
        <StatCard label="Paid" value={formatCurrency(paid)} tone="green" />
        <StatCard
          label="Amount Due"
          value={formatCurrency(amountDue)}
          tone={amountDue > 0 ? 'amber' : 'green'}
        />
      </div>

      <Card className="mt-4" title="Invoice details" actions={<Badge status={inv.status} />} bodyClassName="p-4">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveHeader.submit();
            }}
            className="space-y-4"
          >
            <FormError error={saveHeader.error} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                label="Invoice Reference"
                name="invoiceReference"
                value={draft.invoiceReference}
                onChange={(e) => setDraft({ ...draft, invoiceReference: e.target.value })}
              />
              <TextField
                label="Invoice Date"
                name="invoiceDate"
                type="date"
                value={draft.invoiceDate}
                onChange={(e) => setDraft({ ...draft, invoiceDate: e.target.value })}
              />
              <TextField
                label="Due Date"
                name="dueDate"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </div>
            <p className="text-xs text-slate-500">
              Only draft invoice headers can be edited.
            </p>
            <div className="flex gap-2">
              <Button type="submit" loading={saveHeader.submitting}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={saveHeader.submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Invoice No.</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{inv.number}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Customer</dt>
              <dd className="mt-0.5 text-slate-800">{inv.customer?.name || '-'}</dd>
            </div>
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
        )}
      </Card>

      <Card title="Invoice lines" className="mt-4">
        <DocumentLines
          lines={inv.lines ?? []}
          showAccount
          accounts={accounts.data ?? []}
          analyticAccounts={analytics.data ?? []}
        />
      </Card>

      <Card title="Payments" className="mt-4">
        {inv.allocations?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {inv.allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {allocation.payment?.number || 'Payment'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {allocation.payment?.paymentMethod
                      ? `Paid via ${allocation.payment.paymentMethod}`
                      : formatDate(allocation.createdAt)}
                  </p>
                </div>
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

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          setPayOpen(false);
          toast.success('Payment recorded');
          invoice.reload();
        }}
        documentType="CUSTOMER_INVOICE"
        documentId={inv.id}
        partner={inv.customer}
        amountDue={amountDue}
      />

      <ConfirmDialog
        open={confirmAction === 'confirm'}
        title="Confirm this invoice?"
        message="Confirming posts the sales journal entry. The invoice can no longer be edited."
        confirmLabel="Confirm"
        variant="success"
        loading={confirmInvoice.submitting}
        onConfirm={() => confirmInvoice.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this invoice?"
        message="The invoice moves to CANCELLED. The backend refuses this if payments are already allocated."
        confirmLabel="Cancel invoice"
        loading={cancelInvoice.submitting}
        onConfirm={() => cancelInvoice.submit()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
