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
import ReportDocument, { ReportBlock } from '@/components/reports/ReportDocument';
import BarChart, { SERIES } from '@/components/reports/charts/BarChart';
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

  const periodLabel = `${range.startDate ? formatDate(range.startDate) : 'Inception'} to ${
    range.endDate ? formatDate(range.endDate) : 'today'
  }`;

  return (
    <div className="max-w-4xl">
      <div className="print:hidden">
        <PageHeader
          title="Profit and Loss"
          subtitle="Income less expenses, from posted journal entries only."
          actions={
            <div className="print:hidden">
              <Button variant="secondary" onClick={() => window.print()} disabled={!hasRows}>
                Print / Save as PDF
              </Button>
            </div>
          }
        />
      </div>

      <ReportDocument
        title="Profit and Loss Statement"
        subtitle={periodLabel}
        meta={[
          { label: 'Period', value: periodLabel },
          { label: 'Basis', value: 'Posted entries' },
        ]}
        basis="Prepared from posted journal entries only. Draft and cancelled entries are excluded."
      >
        <Card>
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4 print:hidden">
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
              <ReportBlock>
                <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-4 sm:grid-cols-3">
                  <StatCard label="Total Income" value={formatCurrency(data.totalIncome)} tone="green" />
                  <StatCard label="Total Expenses" value={formatCurrency(data.totalExpenses)} tone="red" />
                  <StatCard
                    label="Net Income"
                    value={formatCurrency(data.netIncome)}
                    tone={Number(data.netIncome) >= 0 ? 'green' : 'red'}
                  />
                </div>
              </ReportBlock>

              {data.income?.length > 0 && (
                <ReportBlock className="border-b border-slate-200">
                  <BarChart
                    title="Income by account"
                    rows={data.income.map((row) => ({
                      label: `${row.code} ${row.name}`,
                      value: row.amount,
                    }))}
                    series={[{ name: 'Income', color: SERIES.blue }]}
                  />
                </ReportBlock>
              )}

              {data.expenses?.length > 0 && (
                <ReportBlock className="border-b border-slate-200">
                  <BarChart
                    title="Expenses by account"
                    rows={data.expenses.map((row) => ({
                      label: `${row.code} ${row.name}`,
                      value: row.amount,
                    }))}
                    series={[{ name: 'Expense', color: SERIES.orange }]}
                  />
                </ReportBlock>
              )}

              <ReportBlock>
                <ReportSection
                  title="Income"
                  rows={data.income ?? []}
                  total={data.totalIncome}
                  totalLabel="Total Income"
                  tone="green"
                />
              </ReportBlock>
              <ReportBlock>
                <ReportSection
                  title="Expenses"
                  rows={data.expenses ?? []}
                  total={data.totalExpenses}
                  totalLabel="Total Expenses"
                  tone="red"
                />
              </ReportBlock>

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
      </ReportDocument>

      {data?.period && (data.period.startDate || data.period.endDate) && (
        <p className="mt-3 text-xs text-slate-500 print:hidden">
          Period: {data.period.startDate ? formatDate(data.period.startDate) : 'inception'} to{' '}
          {data.period.endDate ? formatDate(data.period.endDate) : 'today'}
        </p>
      )}
    </div>
  );
}
