'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import budgetService from '@/services/budget.api';
import analyticAccountService from '@/services/analytic.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { SelectField } from '@/components/ui/Field';
import ProgressBar from '@/components/accounting/ProgressBar';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { ANALYTIC_TYPES, BUDGET_STATUSES } from '@/utils/constants';

function BudgetList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    analyticAccountId: searchParams.get('analyticAccountId') || '',
  });

  const budgets = useApiResource(
    () =>
      budgetService.list({
        status: filters.status || undefined,
        type: filters.type || undefined,
        analyticAccountId: filters.analyticAccountId || undefined,
      }),
    [filters.status, filters.type, filters.analyticAccountId],
  );
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const columns = [
    {
      key: 'name',
      header: 'Budget Name',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'analyticAccount',
      header: 'Analytic',
      render: (row) => row.analyticAccount?.name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'INCOME' ? 'green' : 'amber'}>{row.type}</Badge>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
    },
    {
      key: 'committedAmount',
      header: 'Committed',
      align: 'right',
      render: (row) => formatCurrency(row.committedAmount),
    },
    {
      key: 'achievedAmount',
      header: 'Achieved',
      align: 'right',
      render: (row) => formatCurrency(row.achievedAmount),
    },
    {
      key: 'amountToAchieve',
      header: 'To Achieve',
      align: 'right',
      render: (row) => formatCurrency(row.amountToAchieve),
    },
    {
      key: 'achievedPct',
      header: 'Achieved %',
      render: (row) => (
        <div className="min-w-[120px]">
          <ProgressBar value={row.achievedPct} />
          <span className="text-xs text-slate-500">{formatNumber(row.achievedPct, 1)}%</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Analytical budgets"
        subtitle="Achieved figures are computed by the backend from confirmed invoices and bills."
        actions={
          <Link href="/account/budgets/new">
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={BUDGET_STATUSES.map((value) => ({ value, label: value }))}
            className="w-44"
          />
          <SelectField
            label="Type"
            name="type"
            placeholder="All"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={ANALYTIC_TYPES.map((value) => ({ value, label: value }))}
            className="w-40"
          />
          <SelectField
            label="Analytic account"
            name="analyticAccountId"
            placeholder="All"
            value={filters.analyticAccountId}
            onChange={(e) => setFilters({ ...filters, analyticAccountId: e.target.value })}
            options={(analytics.data ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            className="w-56"
          />
        </div>

        <Table
          columns={columns}
          rows={budgets.data ?? []}
          loading={budgets.loading}
          error={budgets.error}
          onRetry={budgets.reload}
          onRowClick={(row) => router.push(`/account/budgets/${row.id}`)}
          emptyTitle="No budgets"
          emptyDescription="Create a budget against an analytic account to start tracking."
          emptyAction={
            <Link href="/account/budgets/new">
              <Button size="sm">New budget</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BudgetList />
    </Suspense>
  );
}
