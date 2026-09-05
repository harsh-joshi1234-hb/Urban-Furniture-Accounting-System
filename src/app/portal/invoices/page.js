'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import usePortalInvoices from '@/hooks/usePortalInvoices';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { SelectField } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/utils/format';

export default function PortalInvoicesPage() {
  const router = useRouter();
  const { invoices, loading, error, reload } = usePortalInvoices();
  const [filter, setFilter] = useState('');

  const rows = invoices.filter((invoice) => {
    if (filter === 'UNPAID') return invoice.amountDue > 0;
    if (filter === 'PAID') return invoice.amountDue === 0;
    return true;
  });

  const columns = [
    {
      key: 'number',
      header: 'Invoice',
      render: (row) => <span className="font-medium text-stone-900">{row.number}</span>,
    },
    { key: 'invoiceDate', header: 'Invoice Date', render: (row) => formatDate(row.invoiceDate) },
    { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => formatCurrency(row.total),
    },
    { key: 'paid', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paid) },
    {
      key: 'amountDue',
      header: 'Amount Due',
      align: 'right',
      render: (row) => (
        <span className={row.amountDue > 0 ? 'font-medium text-amber-700' : 'text-stone-500'}>
          {formatCurrency(row.amountDue)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader title="My invoices" subtitle="Invoices issued to your account." />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4">
          <SelectField
            label="Show"
            name="filter"
            placeholder="All invoices"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'UNPAID', label: 'Unpaid / partially paid' },
              { value: 'PAID', label: 'Fully paid' },
            ]}
            className="w-56"
          />
        </div>

        <Table
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(row) => router.push(`/portal/invoices/${row.id}`)}
          emptyTitle="No invoices"
          emptyDescription="There are no invoices on your account yet."
        />
      </Card>
    </div>
  );
}
