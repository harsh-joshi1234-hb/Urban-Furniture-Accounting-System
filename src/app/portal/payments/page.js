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
        // Calculate due amount for the invoice
        invoiceTotal: invoice.lines?.reduce((sum, line) => sum + Number(line.total), 0) || 0,
        invoiceAllocated: invoice.allocations?.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0) || 0,
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // The first element is the latest
  const latestId = payments[0]?.id;

  const columns = [
    { 
      key: 'createdAt', 
      header: 'Date', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{formatDate(row.createdAt)}</span>
          {row.id === latestId && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Latest
            </span>
          )}
        </div>
      )
    },
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
      header: 'Amount Paid',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-emerald-600">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Invoice Due',
      align: 'right',
      render: (row) => {
        const due = Math.max(0, row.invoiceTotal - row.invoiceAllocated);
        return due > 0 ? (
          <span className="font-semibold text-rose-600">{formatCurrency(due)}</span>
        ) : (
          <span className="text-slate-500">Paid in full</span>
        );
      },
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
