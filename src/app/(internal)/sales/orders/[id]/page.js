'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { salesOrderService, invoiceService } from '@/services/sales.service';
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

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null); // 'confirm' | 'cancel' | 'invoice'
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ customerId: '', orderDate: '' });

  const order = useApiResource(() => salesOrderService.get(id), [id]);
  const customers = useApiResource(() => contactService.list({ type: 'CUSTOMER' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const confirmOrder = useSubmit(() => salesOrderService.confirm(id), {
    onSuccess: () => {
      toast.success('Sales order confirmed');
      setConfirmAction(null);
      order.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelOrder = useSubmit(() => salesOrderService.cancel(id), {
    onSuccess: () => {
      toast.success('Sales order cancelled');
      setConfirmAction(null);
      order.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const createInvoice = useSubmit(() => invoiceService.createFromSalesOrder(id), {
    onSuccess: (response) => {
      toast.success('Invoice created from sales order');
      setConfirmAction(null);
      router.push(`/sales/invoices/${response.data.id}`);
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const saveHeader = useSubmit(
    () =>
      salesOrderService.update(id, {
        customerId: draft.customerId,
        orderDate: draft.orderDate,
      }),
    {
      onSuccess: () => {
        toast.success('Sales order updated');
        setEditing(false);
        order.reload();
      },
    },
  );

  if (order.loading) return <Loading label="Loading sales order..." />;
  if (order.error) return <ErrorState error={order.error} onRetry={order.reload} />;
  if (!order.data) return <ErrorState error={{ status: 404, message: 'Sales order not found' }} />;

  const so = order.data;
  const isDraft = so.status === 'DRAFT';
  const isConfirmed = so.status === 'CONFIRMED';

  const startEdit = () => {
    setDraft({ customerId: so.customerId, orderDate: toDateInput(so.orderDate) });
    setEditing(true);
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={so.number}
        subtitle={`${so.customer?.name || ''} - ${formatDate(so.orderDate)}`}
        backHref="/sales/orders"
        backLabel="Sales orders"
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
            {isConfirmed && (
              <Button onClick={() => setConfirmAction('invoice')}>Create Invoice</Button>
            )}
            {so.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      <Card
        title="Order details"
        actions={<Badge status={so.status} />}
        bodyClassName="p-4"
      >
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
                label="Customer Name"
                name="customerId"
                required
                value={draft.customerId}
                onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}
                options={(customers.data ?? []).map((contact) => ({
                  value: contact.id,
                  label: contact.name,
                }))}
              />
              <TextField
                label="SO Date"
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
              <dt className="text-xs uppercase tracking-wide text-slate-500">SO No.</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{so.number}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Customer</dt>
              <dd className="mt-0.5 text-slate-800">{so.customer?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Order Date</dt>
              <dd className="mt-0.5 text-slate-800">{formatDate(so.orderDate)}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card title="Order lines" className="mt-4">
        <DocumentLines lines={so.lines ?? []} analyticAccounts={analytics.data ?? []} />
      </Card>

      {so.invoices?.length > 0 && (
        <Card title="Invoices from this order" className="mt-4">
          <ul className="divide-y divide-slate-100">
            {so.invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/sales/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">{invoice.number}</span>
                  <Badge status={invoice.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction === 'confirm'}
        title="Confirm this sales order?"
        message="Confirming locks the order so it can be invoiced."
        confirmLabel="Confirm"
        variant="success"
        loading={confirmOrder.submitting}
        onConfirm={() => confirmOrder.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this sales order?"
        message="The order will move to CANCELLED. This cannot be undone."
        confirmLabel="Cancel order"
        loading={cancelOrder.submitting}
        onConfirm={() => cancelOrder.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'invoice'}
        title="Create invoice from this order?"
        message="A draft customer invoice will be created with the order lines."
        confirmLabel="Create invoice"
        variant="primary"
        loading={createInvoice.submitting}
        onConfirm={() => createInvoice.submit()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
