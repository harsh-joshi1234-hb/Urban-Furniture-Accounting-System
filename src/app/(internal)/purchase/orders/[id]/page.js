'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { purchaseOrderService, vendorBillService } from '@/services/purchase.service';
import contactService from '@/services/contact.api';
import analyticAccountService from '@/services/analytic.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DocumentLines from '@/components/DocumentLines';
import { SelectField, TextField } from '@/components/ui/Field';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { formatDate, toDateInput } from '@/utils/format';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ vendorId: '', orderDate: '' });

  const order = useApiResource(() => purchaseOrderService.get(id), [id]);
  const vendors = useApiResource(() => contactService.list({ type: 'VENDOR' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const confirmOrder = useSubmit(() => purchaseOrderService.confirm(id), {
    onSuccess: () => {
      toast.success('Purchase order confirmed');
      setConfirmAction(null);
      order.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelOrder = useSubmit(() => purchaseOrderService.cancel(id), {
    onSuccess: () => {
      toast.success('Purchase order cancelled');
      setConfirmAction(null);
      order.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const createBill = useSubmit(() => vendorBillService.createFromPurchaseOrder(id), {
    onSuccess: (response) => {
      toast.success('Vendor bill created from purchase order');
      setConfirmAction(null);
      router.push(`/purchase/bills/${response.data.id}`);
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const saveHeader = useSubmit(
    () =>
      purchaseOrderService.update(id, {
        vendorId: draft.vendorId,
        orderDate: draft.orderDate,
      }),
    {
      onSuccess: () => {
        toast.success('Purchase order updated');
        setEditing(false);
        order.reload();
      },
    },
  );

  if (order.loading) return <Loading label="Loading purchase order..." />;
  if (order.error) return <ErrorState error={order.error} onRetry={order.reload} />;
  if (!order.data) {
    return <ErrorState error={{ status: 404, message: 'Purchase order not found' }} />;
  }

  const po = order.data;
  const isDraft = po.status === 'DRAFT';
  const isConfirmed = po.status === 'CONFIRMED';

  const startEdit = () => {
    setDraft({ vendorId: po.vendorId, orderDate: toDateInput(po.orderDate) });
    setEditing(true);
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={po.number}
        subtitle={`${po.vendor?.name || ''} - ${formatDate(po.orderDate)}`}
        backHref="/purchase/orders"
        backLabel="Purchase orders"
        actions={
          <>
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
            {isConfirmed && <Button onClick={() => setConfirmAction('bill')}>Create Bill</Button>}
            {po.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      <Card title="Order details" actions={<Badge status={po.status} />} bodyClassName="p-4">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveHeader.submit();
            }}
            className="space-y-4"
          >
            <FormError error={saveHeader.error} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Vendor Name"
                name="vendorId"
                required
                value={draft.vendorId}
                onChange={(e) => setDraft({ ...draft, vendorId: e.target.value })}
                options={(vendors.data ?? []).map((contact) => ({
                  value: contact.id,
                  label: contact.name,
                }))}
              />
              <TextField
                label="PO Date"
                name="orderDate"
                type="date"
                required
                value={draft.orderDate}
                onChange={(e) => setDraft({ ...draft, orderDate: e.target.value })}
              />
            </div>
            <p className="text-xs text-slate-500">
              Only the draft header can be edited. Lines are fixed once the order is created.
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
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">PO No.</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{po.number}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Vendor</dt>
              <dd className="mt-0.5 text-slate-800">{po.vendor?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">PO Date</dt>
              <dd className="mt-0.5 text-slate-800">{formatDate(po.orderDate)}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card title="Order lines" className="mt-4">
        <DocumentLines lines={po.lines ?? []} analyticAccounts={analytics.data ?? []} />
      </Card>

      {po.bills?.length > 0 && (
        <Card title="Bills from this order" className="mt-4">
          <ul className="divide-y divide-slate-100">
            {po.bills.map((bill) => (
              <li key={bill.id}>
                <Link
                  href={`/purchase/bills/${bill.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">{bill.number}</span>
                  <Badge status={bill.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction === 'confirm'}
        title="Confirm this purchase order?"
        message="Confirming locks the order so a vendor bill can be created."
        confirmLabel="Confirm"
        variant="success"
        loading={confirmOrder.submitting}
        onConfirm={() => confirmOrder.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this purchase order?"
        message="The order will move to CANCELLED. This cannot be undone."
        confirmLabel="Cancel order"
        loading={cancelOrder.submitting}
        onConfirm={() => cancelOrder.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'bill'}
        title="Create bill from this order?"
        message="A draft vendor bill will be created with the order lines."
        confirmLabel="Create bill"
        variant="primary"
        loading={createBill.submitting}
        onConfirm={() => createBill.submit()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
