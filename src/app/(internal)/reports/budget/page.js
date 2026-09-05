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
import KanbanBoard from '@/components/ui/KanbanBoard';
import ViewToggle from '@/components/ui/ViewToggle';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/accounting/ProgressBar';
import PieChartModal from '@/components/ui/PieChartModal';
import ReportDocument, { ReportBlock } from '@/components/reports/ReportDocument';
import BarChart, { SERIES } from '@/components/reports/charts/BarChart';
import { SelectField, TextField } from '@/components/ui/Field';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { ANALYTIC_TYPES, BUDGET_STATUSES } from '@/utils/constants';

const CHART_LIMIT = 12;

export default function BudgetReportPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    analyticAccountId: '',
    responsibleContactId: '',
    status: '',
  });
  const [viewMode, setViewMode] = useState('list');
  const [pieChartData, setPieChartData] = useState(null);

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

  const budgetRows = report.data?.budgets ?? [];
  // The chart stays readable; the table below always carries every row.
  const chartRows = [...budgetRows]
    .sort((a, b) => Number(b.committedAmount) - Number(a.committedAmount))
    .slice(0, CHART_LIMIT);
  const periodLabel = `${filters.startDate ? formatDate(filters.startDate) : 'Inception'} to ${
    filters.endDate ? formatDate(filters.endDate) : 'today'
  }`;

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
    {
      key: 'pieChart',
      header: 'Pie Chart',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPieChartData(row);
          }}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          title="View Budget Chart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Budget Report"
          subtitle="Committed against achieved, computed by the backend for each budget."
          actions={
            <div className="flex items-center gap-3 print:hidden">
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              <Button variant="secondary" onClick={() => window.print()}>
                Print / Save as PDF
              </Button>
            </div>
          }
        />
      </div>

      <ReportDocument
        title="Budget Report"
        subtitle={periodLabel}
        meta={[
          { label: 'Period', value: periodLabel },
          { label: 'Budgets', value: String(budgetRows.length) },
        ]}
        basis="Achieved amounts are computed by the accounting system from confirmed invoice and vendor bill lines carrying each budget's analytic account."
      >
        <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4 print:hidden">
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

        {budgetRows.length > 0 && (
          <ReportBlock className="border-b border-slate-200">
            <BarChart
              title={
                budgetRows.length > CHART_LIMIT
                  ? `Committed against achieved (top ${CHART_LIMIT} by committed amount)`
                  : 'Committed against achieved'
              }
              rows={chartRows.map((row) => ({
                label: row.name,
                values: [Number(row.committedAmount), Number(row.achievedAmount)],
              }))}
              series={[
                { name: 'Committed', color: SERIES.blue },
                { name: 'Achieved', color: SERIES.orange },
              ]}
            />
          </ReportBlock>
        )}

        {viewMode === 'list' ? (
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
        ) : (
          <>
          <div className="print:hidden">
          <KanbanBoard
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
            renderCard={(row) => (
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/account/budgets/${row.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 truncate">
                    {row.name}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPieChartData(row);
                    }}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <Badge tone={row.type === 'INCOME' ? 'green' : 'amber'}>{row.type}</Badge>
                  <Badge status={row.status} />
                </div>

                <div className="text-sm text-slate-500 mb-4">
                  <span className="block">{formatDate(row.startDate)} - {formatDate(row.endDate)}</span>
                  {row.analyticAccount && <span className="block mt-1">Analytic: <span className="font-medium text-slate-700">{row.analyticAccount}</span></span>}
                </div>

                <div className="mt-auto space-y-2 text-sm border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Committed:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(row.committedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Achieved:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(row.achievedAmount)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{formatNumber(row.achievedPct, 1)}%</span>
                    </div>
                    <ProgressBar value={row.achievedPct} />
                  </div>
                </div>
              </div>
            )}
          />
          </div>
          <div className="hidden print:block">
            <Table
              columns={columns}
              rows={budgetRows}
              emptyTitle="No budgets in this report"
            />
          </div>
          </>
        )}
        </Card>
      </ReportDocument>

      <PieChartModal 
        isOpen={!!pieChartData} 
        data={pieChartData} 
        onClose={() => setPieChartData(null)} 
      />
    </div>
  );
}
