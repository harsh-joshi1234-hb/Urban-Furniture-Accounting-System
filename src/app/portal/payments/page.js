'use client';

import Link from 'next/link';
import usePortalInvoices from '@/hooks/usePortalInvoices';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/utils/format';

/**
 * Payment history, read from the allocations the backend returns on the
 * customer's own invoices.
 */
export default function PortalPaymentsPage() {
  const { invoices, loading, error, reload } = usePortalInvoices();

  const payments = invoices
    .flatMap((invoice) =>
      (invoice.allocations ?? []).map((allocation) => ({
        id: allocation.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: allocation.allocatedAmount,
        createdAt: allocation.createdAt,
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const columns = [
    { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (row) => (
        <Link
          href={`/portal/invoices/${row.invoiceId}`}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-emerald-600">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="My payments" subtitle="Payments applied to your invoices." />
      <Card>
        <Table
          columns={columns}
          rows={payments}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="No payments yet"
          emptyDescription="Payments applied to your invoices will appear here."
        />
      </Card>
    </div>
  );
}
