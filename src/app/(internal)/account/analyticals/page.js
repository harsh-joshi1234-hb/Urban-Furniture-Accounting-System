'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import analyticAccountService from '@/services/analytic.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';

export default function AnalyticalsPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useApiResource(
    () => analyticAccountService.list(),
    [],
  );

  const columns = [
    {
      key: 'name',
      header: 'Analytic Account',
      render: (row) => <span className="font-medium text-stone-900">{row.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'INCOME' ? 'green' : 'amber'}>{row.type}</Badge>
      ),
    },
    { key: 'startDate', header: 'Start Date', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', header: 'End Date', render: (row) => formatDate(row.endDate) },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Analytical accounts"
        subtitle="Used to tag order, invoice and bill lines for budget tracking."
        actions={
          <Link href="/account/analyticals/new">
            <Button>New</Button>
          </Link>
        }
      />

      <Card>
        <Table
          columns={columns}
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(row) => router.push(`/account/analyticals/${row.id}`)}
          emptyTitle="No analytical accounts"
          emptyDescription="Create one to start tagging document lines."
          emptyAction={
            <Link href="/account/analyticals/new">
              <Button size="sm">New analytic account</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
