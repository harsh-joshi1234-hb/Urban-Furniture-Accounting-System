'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { journalEntryService, journalService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { SelectField } from '@/components/ui/Field';
import { formatCurrency, formatDate, titleCase } from '@/utils/format';
import { sumAmounts } from '@/utils/money';

const ENTRY_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'];

function JournalEntryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    journalId: searchParams.get('journalId') || '',
  });

  const entries = useApiResource(
    () =>
      journalEntryService.list({
        status: filters.status || undefined,
        journalId: filters.journalId || undefined,
      }),
    [filters.status, filters.journalId],
  );
  const journals = useApiResource(() => journalService.list(), []);

  const columns = [
    {
      key: 'number',
      header: 'Number',
      render: (row) => <span className="font-medium text-slate-900">{row.number}</span>,
    },
    {
      key: 'accountingDate',
      header: 'Date',
      render: (row) => formatDate(row.accountingDate),
    },
    { key: 'journal', header: 'Journal', render: (row) => row.journal?.name || '-' },
    {
      key: 'sourceType',
      header: 'Source',
      render: (row) => <Badge tone="slate">{titleCase(row.sourceType)}</Badge>,
    },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      render: (row) => formatCurrency(sumAmounts((row.items ?? []).map((i) => i.debit))),
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      render: (row) => formatCurrency(sumAmounts((row.items ?? []).map((i) => i.credit))),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Journal entries"
        subtitle="Entries posted automatically by confirmed documents, plus manual entries."
        actions={
          <Link href="/account/journal-entries/new">
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
            options={ENTRY_STATUSES.map((value) => ({ value, label: titleCase(value) }))}
            className="w-44"
          />
          <SelectField
            label="Journal"
            name="journalId"
            placeholder="All"
            value={filters.journalId}
            onChange={(e) => setFilters({ ...filters, journalId: e.target.value })}
            options={(journals.data ?? []).map((journal) => ({
              value: journal.id,
              label: `${journal.name} (${journal.type})`,
            }))}
            className="w-56"
          />
        </div>

        <Table
          columns={columns}
          rows={entries.data ?? []}
          loading={entries.loading}
          error={entries.error}
          onRetry={entries.reload}
          onRowClick={(row) => router.push(`/account/journal-entries/${row.id}`)}
          emptyTitle="No journal entries"
          emptyDescription="Confirm an invoice or bill, or create a manual entry."
          emptyAction={
            <Link href="/account/journal-entries/new">
              <Button size="sm">New entry</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

export default function JournalEntriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <JournalEntryList />
    </Suspense>
  );
}
