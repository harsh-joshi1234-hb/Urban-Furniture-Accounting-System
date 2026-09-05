'use client';

import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import reportService from '@/services/report.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import ReportSection from '@/components/accounting/ReportSection';
import { TextField } from '@/components/ui/Field';
import { formatCurrency } from '@/utils/format';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState('');

  const report = useApiResource(
    () => reportService.balanceSheet({ asOfDate: asOfDate || undefined }),
    [asOfDate],
  );

  const data = report.data;
  const hasRows =
    (data?.assets?.length ?? 0) +
      (data?.liabilities?.length ?? 0) +
      (data?.capital?.length ?? 0) >
    0;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Balance Sheet"
        subtitle="Assets, liabilities and capital from posted journal entries."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <TextField
            label="As of date"
            name="asOfDate"
            type="date"
            hint="Leave blank for all posted entries to date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-52"
          />
          {asOfDate && (
            <Button variant="secondary" onClick={() => setAsOfDate('')}>
              Clear
            </Button>
          )}
        </div>

        {report.loading ? (
          <Loading label="Loading balance sheet..." />
        ) : report.error ? (
          <ErrorState error={report.error} onRetry={report.reload} />
        ) : !hasRows ? (
          <EmptyState
            icon="⚖️"
            title="Nothing to report"
            description="No posted journal entries exist for this date."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-4 sm:grid-cols-3">
              <StatCard label="Total Assets" value={formatCurrency(data.totalAssets)} />
              <StatCard label="Total Liabilities" value={formatCurrency(data.totalLiabilities)} />
              <StatCard label="Total Capital" value={formatCurrency(data.totalCapital)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
              <div>
                <ReportSection
                  title="Assets"
                  rows={data.assets ?? []}
                  total={data.totalAssets}
                  totalLabel="Total Assets"
                />
              </div>
              <div>
                <ReportSection
                  title="Liabilities"
                  rows={data.liabilities ?? []}
                  total={data.totalLiabilities}
                  totalLabel="Total Liabilities"
                />
                <ReportSection
                  title="Capital"
                  rows={data.capital ?? []}
                  total={data.totalCapital}
                  totalLabel="Total Capital"
                />
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-700">
                    Liabilities + Capital
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(
                      Number(data.totalLiabilities) + Number(data.totalCapital),
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">
                Assets = Liabilities + Capital
              </span>
              {/* isBalanced is asserted by the backend, not recomputed here. */}
              <Badge tone={data.isBalanced ? 'green' : 'red'}>
                {data.isBalanced ? 'Balanced' : 'Not balanced'}
              </Badge>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
