'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { SelectField, TextField } from '@/components/ui/Field';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import { withRunningBalance } from '@/utils/money';

function LedgerScreen() {
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const accounts = useApiResource(() => accountService.list(), []);

  const params = useMemo(
    () => ({
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
    }),
    [range.startDate, range.endDate],
  );

  const ledger = useApiResource(
    () => accountService.ledger(accountId, params),
    [accountId, range.startDate, range.endDate],
    { enabled: Boolean(accountId) },
  );

  // Authoritative totals for the same account and period.
  const balance = useApiResource(
    () => accountService.balance(accountId, params),
    [accountId, range.startDate, range.endDate],
    { enabled: Boolean(accountId) },
  );

  const account = (accounts.data ?? []).find((item) => item.id === accountId);

  const rows = useMemo(
    () => withRunningBalance(ledger.data ?? [], account?.type),
    [ledger.data, account?.type],
  );

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.entry?.accountingDate),
    },
    {
      key: 'entry',
      header: 'Entry',
      render: (row) =>
        row.entry ? (
          <Link
            href={`/account/journal-entries/${row.entry.id}`}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            {row.entry.number}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <Badge tone="slate">{titleCase(row.entry?.sourceType || 'MANUAL')}</Badge>
      ),
    },
    { key: 'description', header: 'Description', render: (row) => row.description || '-' },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      render: (row) => (Number(row.debit) ? formatCurrency(row.debit) : '-'),
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      render: (row) => (Number(row.credit) ? formatCurrency(row.credit) : '-'),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.balance)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ledger &amp; account balances"
        subtitle="Posted journal items only. Draft and cancelled entries never affect a balance."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <SelectField
            label="Account"
            name="accountId"
            placeholder="Select an account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={(accounts.data ?? []).map((item) => ({
              value: item.id,
              label: `${item.code} - ${item.name}`,
            }))}
            className="min-w-[240px] flex-1"
          />
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
              Clear dates
            </Button>
          )}
        </div>

        {!accountId ? (
          <EmptyState
            icon="📒"
            title="Pick an account"
            description="Choose an account above to see its posted ledger and balance."
          />
        ) : accounts.loading ? (
          <Loading label="Loading accounts..." />
        ) : (
          <>
            {balance.error ? (
              <div className="border-b border-slate-200 p-4">
                <ErrorState error={balance.error} onRetry={balance.reload} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-4 sm:grid-cols-3">
                <StatCard
                  label="Total Debit"
                  value={balance.loading ? '...' : formatCurrency(balance.data?.debitTotal)}
                />
                <StatCard
                  label="Total Credit"
                  value={balance.loading ? '...' : formatCurrency(balance.data?.creditTotal)}
                />
                <StatCard
                  label="Closing Balance"
                  value={balance.loading ? '...' : formatCurrency(balance.data?.balance)}
                  tone="indigo"
                  hint="Computed by the backend"
                />
              </div>
            )}

            <Table
              columns={columns}
              rows={rows}
              loading={ledger.loading}
              error={ledger.error}
              onRetry={ledger.reload}
              emptyTitle="No posted entries"
              emptyDescription="This account has no posted journal items in the selected period."
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LedgerScreen />
    </Suspense>
  );
}
