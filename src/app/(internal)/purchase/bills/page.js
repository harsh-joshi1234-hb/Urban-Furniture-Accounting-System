'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { vendorBillService } from '@/services/purchase.service';
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

function BillList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const { data, loading, error, reload } = useApiResource(
    () => vendorBillService.list(status ? { status } : undefined),
    [status],
  );

  const columns = [
    {
      key: 'number',
      header: 'Bill No.',
      render: (row) => <span className="font-medium text-stone-900">{row.number}</span>,
    },
    { key: 'vendor', header: 'Vendor', render: (row) => row.vendor?.name || '-' },
    { key: 'reference', header: 'Reference', render: (row) => row.billReference || '-' },
    { key: 'billDate', header: 'Bill Date', render: (row) => formatDate(row.billDate) },
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
        title="Vendor bills"
        subtitle="Confirm a bill to post its purchase journal entry, then pay it."
        actions={
          <Link href="/purchase/bills/new">
            <Button>New</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4">
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
          onRowClick={(row) => router.push(`/purchase/bills/${row.id}`)}
          emptyTitle="No vendor bills"
          emptyDescription="Create a bill directly or from a confirmed purchase order."
          emptyAction={
            <Link href="/purchase/bills/new">
              <Button size="sm">New vendor bill</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BillList />
    </Suspense>
  );
}
