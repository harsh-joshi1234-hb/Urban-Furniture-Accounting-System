'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { vendorBillService } from '@/services/purchase.service';
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

export default function VendorBillDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ billReference: '', billDate: '', dueDate: '' });

  const bill = useApiResource(() => vendorBillService.get(id), [id]);
  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const accounts = useApiResource(() => accountService.list(), []);

  const confirmBill = useSubmit(() => vendorBillService.confirm(id), {
    onSuccess: () => {
      toast.success('Bill confirmed and journal entry posted');
      setConfirmAction(null);
      bill.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelBill = useSubmit(() => vendorBillService.cancel(id), {
    onSuccess: () => {
      toast.success('Bill cancelled');
      setConfirmAction(null);
      bill.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const saveHeader = useSubmit(
    () =>
      vendorBillService.update(id, {
        billReference: draft.billReference || undefined,
        billDate: draft.billDate,
        dueDate: draft.dueDate,
      }),
    {
      onSuccess: () => {
        toast.success('Bill updated');
        setEditing(false);
        bill.reload();
      },
    },
  );

  if (bill.loading) return <Loading label="Loading vendor bill..." />;
  if (bill.error) return <ErrorState error={bill.error} onRetry={bill.reload} />;
  if (!bill.data) return <ErrorState error={{ status: 404, message: 'Vendor bill not found' }} />;

  const doc = bill.data;
  const total = sumLineTotals(doc.lines);
  const paid = sumAllocations(doc.allocations);
  const amountDue = Math.max(total - paid, 0);
  const isDraft = doc.status === 'DRAFT';
  const canPay = ['CONFIRMED', 'PARTIALLY_PAID'].includes(doc.status) && amountDue > 0;

  const startEdit = () => {
    setDraft({
      billReference: doc.billReference || '',
      billDate: toDateInput(doc.billDate),
      dueDate: toDateInput(doc.dueDate),
    });
    setEditing(true);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={doc.number}
        subtitle={`${doc.vendor?.name || ''} - ${formatDate(doc.billDate)}`}
        backHref="/purchase/bills"
        backLabel="Vendor bills"
        actions={
          <>
            {doc.purchaseOrderId && (
              <Link href={`/purchase/orders/${doc.purchaseOrderId}`}>
                <Button variant="secondary">PO</Button>
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
            {!['CANCELLED', 'PAID'].includes(doc.status) && (
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

      <Card className="mt-4" title="Bill details" actions={<Badge status={doc.status} />} bodyClassName="p-4">
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
                label="Bill Reference"
                name="billReference"
                value={draft.billReference}
                onChange={(e) => setDraft({ ...draft, billReference: e.target.value })}
              />
              <TextField
                label="Bill Date"
                name="billDate"
                type="date"
                value={draft.billDate}
                onChange={(e) => setDraft({ ...draft, billDate: e.target.value })}
              />
              <TextField
                label="Due Date"
                name="dueDate"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </div>
            <p className="text-xs text-stone-500">Only draft bill headers can be edited.</p>
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
              <dt className="text-xs uppercase tracking-wide text-stone-500">Bill No.</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{doc.number}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Vendor</dt>
              <dd className="mt-0.5 text-stone-800">{doc.vendor?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Reference</dt>
              <dd className="mt-0.5 text-stone-800">{doc.billReference || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Bill Date</dt>
              <dd className="mt-0.5 text-stone-800">{formatDate(doc.billDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Due Date</dt>
              <dd className="mt-0.5 text-stone-800">{formatDate(doc.dueDate)}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card title="Bill lines" className="mt-4">
        <DocumentLines
          lines={doc.lines ?? []}
          showAccount
          accounts={accounts.data ?? []}
          analyticAccounts={analytics.data ?? []}
        />
      </Card>

      <Card title="Payments" className="mt-4">
        {doc.allocations?.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {doc.allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {allocation.payment?.number || 'Payment'}
                  </p>
                  <p className="text-xs text-stone-500">
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
          <p className="px-4 py-6 text-center text-sm text-stone-500">
            No payments recorded against this bill yet.
          </p>
        )}
      </Card>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          setPayOpen(false);
          toast.success('Payment recorded');
          bill.reload();
        }}
        documentType="VENDOR_BILL"
        documentId={doc.id}
        partner={doc.vendor}
        amountDue={amountDue}
      />

      <ConfirmDialog
        open={confirmAction === 'confirm'}
        title="Confirm this bill?"
        message="Confirming posts the purchase journal entry. The bill can no longer be edited."
        confirmLabel="Confirm"
        variant="success"
        loading={confirmBill.submitting}
        onConfirm={() => confirmBill.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this bill?"
        message="The bill moves to CANCELLED. The backend refuses this if payments are already allocated."
        confirmLabel="Cancel bill"
        loading={cancelBill.submitting}
        onConfirm={() => cancelBill.submit()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
