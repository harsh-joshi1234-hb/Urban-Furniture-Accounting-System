'use client';

import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import reportService from '@/services/report.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import ReportSection from '@/components/accounting/ReportSection';
import { TextField } from '@/components/ui/Field';
import { formatCurrency, formatDate } from '@/utils/format';

export default function ProfitAndLossPage() {
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const report = useApiResource(
    () =>
      reportService.profitAndLoss({
        startDate: range.startDate || undefined,
        endDate: range.endDate || undefined,
      }),
    [range.startDate, range.endDate],
  );

  const data = report.data;
  const hasRows = (data?.income?.length ?? 0) + (data?.expenses?.length ?? 0) > 0;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Profit and Loss"
        subtitle="Income less expenses, from posted journal entries only."
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
            value={range.startDate}
            onChange={(e) => setRange({ ...range, startDate: e.target.value })}
            className="w-44"
          />
          <TextField
            label="To"
            name="endDate"
            type="date"
            value={range.endDate}
            onChange={(e) => setRange({ ...range, endDate: e.target.value })}
            className="w-44"
          />
          {(range.startDate || range.endDate) && (
            <Button
              variant="secondary"
              onClick={() => setRange({ startDate: '', endDate: '' })}
            >
              Clear
            </Button>
          )}
        </div>

        {report.loading ? (
          <Loading label="Loading profit and loss..." />
        ) : report.error ? (
          <ErrorState error={report.error} onRetry={report.reload} />
        ) : !hasRows ? (
          <EmptyState
            icon="📊"
            title="Nothing to report"
            description="No posted journal entries fall in this period."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-4 sm:grid-cols-3">
              <StatCard label="Total Income" value={formatCurrency(data.totalIncome)} tone="green" />
              <StatCard label="Total Expenses" value={formatCurrency(data.totalExpenses)} tone="red" />
              <StatCard
                label="Net Income"
                value={formatCurrency(data.netIncome)}
                tone={Number(data.netIncome) >= 0 ? 'green' : 'red'}
              />
            </div>

            <ReportSection
              title="Income"
              rows={data.income ?? []}
              total={data.totalIncome}
              totalLabel="Total Income"
              tone="green"
            />
            <ReportSection
              title="Expenses"
              rows={data.expenses ?? []}
              total={data.totalExpenses}
              totalLabel="Total Expenses"
              tone="red"
            />

            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Net Income</span>
              <span
                className={`text-base font-semibold ${
                  Number(data.netIncome) >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(data.netIncome)}
              </span>
            </div>
          </>
        )}
      </Card>

      {data?.period && (data.period.startDate || data.period.endDate) && (
        <p className="mt-3 text-xs text-slate-500">
          Period: {data.period.startDate ? formatDate(data.period.startDate) : 'inception'} to{' '}
          {data.period.endDate ? formatDate(data.period.endDate) : 'today'}
        </p>
      )}
    </div>
  );
}
