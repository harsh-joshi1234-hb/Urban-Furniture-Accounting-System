'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { invoiceService } from '@/services/sales.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PaymentDialog from '@/components/forms/PaymentDialog';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, sumAllocations, sumLineTotals } from '@/utils/format';

/**
 * Receipts = customer payments. The backend exposes payment creation and
 * allocation but no payment list endpoint, so recorded receipts are read back
 * from the allocations the backend returns on each invoice.
 */
export default function ReceiptsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApiResource(() => invoiceService.list(), []);
  const [paying, setPaying] = useState(null);

  const invoices = useMemo(() => data ?? [], [data]);

  const outstanding = useMemo(
    () =>
      invoices
        .filter((invoice) => ['CONFIRMED', 'PARTIALLY_PAID'].includes(invoice.status))
        .map((invoice) => {
          const total = sumLineTotals(invoice.lines);
          const paid = sumAllocations(invoice.allocations);
          return { ...invoice, total, paid, amountDue: Math.max(total - paid, 0) };
        })
        .filter((invoice) => invoice.amountDue > 0),
    [invoices],
  );

  const receipts = useMemo(
    () =>
      invoices.flatMap((invoice) =>
        (invoice.allocations ?? []).map((allocation) => ({
          id: allocation.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          customer: invoice.customer?.name,
          amount: allocation.allocatedAmount,
          createdAt: allocation.createdAt,
        })),
      ),
    [invoices],
  );

  const outstandingColumns = [
    {
      key: 'number',
      header: 'Invoice',
      render: (row) => (
        <Link
          href={`/sales/invoices/${row.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          {row.number}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (row) => row.customer?.name || '-' },
    { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'total', header: 'Total', align: 'right', render: (row) => formatCurrency(row.total) },
    { key: 'paid', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paid) },
    {
      key: 'amountDue',
      header: 'Amount Due',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-amber-700">{formatCurrency(row.amountDue)}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button size="sm" onClick={() => setPaying(row)}>
          Receive
        </Button>
      ),
    },
  ];

  const receiptColumns = [
    { key: 'createdAt', header: 'Recorded', render: (row) => formatDate(row.createdAt) },
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (row) => (
        <Link
          href={`/sales/invoices/${row.invoiceId}`}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          {row.invoiceNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer' },
    {
      key: 'amount',
      header: 'Amount received',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-emerald-600">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Receipts"
        subtitle="Record customer payments against confirmed invoices."
      />

      <Card title="Outstanding invoices">
        <Table
          columns={outstandingColumns}
          rows={outstanding}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="Nothing outstanding"
          emptyDescription="Every confirmed invoice is fully paid."
        />
      </Card>

      <Card title="Recorded receipts" className="mt-5">
        <Table
          columns={receiptColumns}
          rows={receipts}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="No receipts yet"
          emptyDescription="Customer payments you record will be listed here."
        />
      </Card>

      <PaymentDialog
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setPaying(null);
          toast.success('Receipt recorded');
          reload();
        }}
        documentType="CUSTOMER_INVOICE"
        documentId={paying?.id}
        partner={paying?.customer}
        amountDue={paying?.amountDue}
      />
    </div>
  );
}
