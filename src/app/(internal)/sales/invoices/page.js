'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { invoiceService } from '@/services/sales.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { SelectField } from '@/components/ui/Field';
import {
  formatCurrency,
  formatDate,
  sumAllocations,
  sumLineTotals,
} from '@/utils/format';
import { INVOICE_STATUSES } from '@/utils/constants';

function InvoiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const { data, loading, error, reload } = useApiResource(
    () => invoiceService.list(status ? { status } : undefined),
    [status],
  );

  const columns = [
    {
      key: 'number',
      header: 'Invoice No.',
      render: (row) => <span className="font-medium text-slate-900">{row.number}</span>,
    },
    { key: 'customer', header: 'Customer', render: (row) => row.customer?.name || '-' },
    { key: 'reference', header: 'Reference', render: (row) => row.invoiceReference || '-' },
    { key: 'invoiceDate', header: 'Invoice Date', render: (row) => formatDate(row.invoiceDate) },
    { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => formatCurrency(sumLineTotals(row.lines)),
    },
    {
      key: 'due',
      header: 'Amount Due',
      align: 'right',
      render: (row) =>
        formatCurrency(
          Math.max(sumLineTotals(row.lines) - sumAllocations(row.allocations), 0),
        ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Customer invoices"
        subtitle="Confirm an invoice to post its journal entry, then record payment."
        actions={
          <Link href="/sales/invoices/new">
            <Button>New</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <SelectField
            label="Status"
            name="status"
            placeholder="All"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={INVOICE_STATUSES.map((value) => ({ value, label: value }))}
            className="w-52"
          />
        </div>

        <Table
          columns={columns}
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(row) => router.push(`/sales/invoices/${row.id}`)}
          emptyTitle="No invoices"
          emptyDescription="Create an invoice directly or from a confirmed sales order."
          emptyAction={
            <Link href="/sales/invoices/new">
              <Button size="sm">New invoice</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InvoiceList />
    </Suspense>
  );
}
