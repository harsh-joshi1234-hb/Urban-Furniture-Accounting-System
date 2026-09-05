'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { purchaseOrderService } from '@/services/purchase.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { SelectField } from '@/components/ui/Field';
import { formatCurrency, formatDate, sumLineTotals } from '@/utils/format';
import { ORDER_STATUSES } from '@/utils/constants';

function PurchaseOrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const { data, loading, error, reload } = useApiResource(
    () => purchaseOrderService.list(status ? { status } : undefined),
    [status],
  );

  const columns = [
    {
      key: 'number',
      header: 'PO No.',
      render: (row) => <span className="font-medium text-slate-900">{row.number}</span>,
    },
    { key: 'vendor', header: 'Vendor', render: (row) => row.vendor?.name || '-' },
    { key: 'orderDate', header: 'PO Date', render: (row) => formatDate(row.orderDate) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => formatCurrency(sumLineTotals(row.lines)),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        subtitle="Confirm an order to create its vendor bill."
        actions={
          <Link href="/purchase/orders/new">
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
            options={ORDER_STATUSES.map((value) => ({ value, label: value }))}
            className="w-48"
          />
        </div>

        <Table
          columns={columns}
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(row) => router.push(`/purchase/orders/${row.id}`)}
          emptyTitle="No purchase orders"
          emptyDescription="Create a purchase order to start the purchase workflow."
          emptyAction={
            <Link href="/purchase/orders/new">
              <Button size="sm">New purchase order</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseOrderList />
    </Suspense>
  );
}
