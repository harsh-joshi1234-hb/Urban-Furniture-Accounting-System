'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import reportService from '@/services/report.api';
import analyticAccountService from '@/services/analytic.service';
import contactService from '@/services/contact.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/accounting/ProgressBar';
import { SelectField, TextField } from '@/components/ui/Field';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { ANALYTIC_TYPES, BUDGET_STATUSES } from '@/utils/constants';

export default function BudgetReportPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    analyticAccountId: '',
    responsibleContactId: '',
    status: '',
  });

  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const contacts = useApiResource(() => contactService.list(), []);

  const report = useApiResource(
    () =>
      reportService.budget({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type || undefined,
        analyticAccountId: filters.analyticAccountId || undefined,
        responsibleContactId: filters.responsibleContactId || undefined,
        status: filters.status || undefined,
      }),
    [
      filters.startDate,
      filters.endDate,
      filters.type,
      filters.analyticAccountId,
      filters.responsibleContactId,
      filters.status,
    ],
  );

  const update = (key) => (event) => setFilters({ ...filters, [key]: event.target.value });
  const hasFilters = Object.values(filters).some(Boolean);

  const columns = [
    {
      key: 'name',
      header: 'Budget',
      render: (row) => (
        <Link
          href={`/account/budgets/${row.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          {row.name}
        </Link>
      ),
    },
    { key: 'analyticAccount', header: 'Analytic', render: (row) => row.analyticAccount || '-' },
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
    { key: 'responsible', header: 'Responsible', render: (row) => row.responsible || '-' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Budget Report"
        subtitle="Committed against achieved, computed by the backend for each budget."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <TextField
            label="From"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={update('startDate')}
            className="w-40"
          />
          <TextField
            label="To"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={update('endDate')}
            className="w-40"
          />
          <SelectField
            label="Type"
            name="type"
            placeholder="All"
            value={filters.type}
            onChange={update('type')}
            options={ANALYTIC_TYPES.map((value) => ({ value, label: value }))}
            className="w-36"
          />
          <SelectField
            label="Status"
            name="status"
            placeholder="All"
            value={filters.status}
            onChange={update('status')}
            options={BUDGET_STATUSES.map((value) => ({ value, label: value }))}
            className="w-40"
          />
          <SelectField
            label="Analytic"
            name="analyticAccountId"
            placeholder="All"
            value={filters.analyticAccountId}
            onChange={update('analyticAccountId')}
            options={(analytics.data ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            className="w-48"
          />
          <SelectField
            label="Responsible"
            name="responsibleContactId"
            placeholder="All"
            value={filters.responsibleContactId}
            onChange={update('responsibleContactId')}
            options={(contacts.data ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            className="w-48"
          />
          {hasFilters && (
            <Button
              variant="secondary"
              onClick={() =>
                setFilters({
                  startDate: '',
                  endDate: '',
                  type: '',
                  analyticAccountId: '',
                  responsibleContactId: '',
                  status: '',
                })
              }
            >
              Clear
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          rows={report.data?.budgets ?? []}
          loading={report.loading}
          error={report.error}
          onRetry={report.reload}
          emptyTitle="No budgets in this report"
          emptyDescription={
            hasFilters
              ? 'No budget matches the selected filters.'
              : 'Create and confirm a budget to see it here.'
          }
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
