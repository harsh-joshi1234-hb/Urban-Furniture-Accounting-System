'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, titleCase } from '@/utils/format';

export default function AccountDetailPage() {
  const { id } = useParams();

  const account = useApiResource(() => accountService.get(id), [id]);
  // Authoritative balance - computed by the backend from POSTED entries only.
  const balance = useApiResource(() => accountService.balance(id), [id]);

  if (account.loading) return <Loading label="Loading account..." />;
  if (account.error) return <ErrorState error={account.error} onRetry={account.reload} />;
  if (!account.data) return <ErrorState error={{ status: 404, message: 'Account not found' }} />;

  const acc = account.data;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`${acc.code} - ${acc.name}`}
        subtitle={titleCase(acc.type)}
        backHref="/account/chart-of-accounts"
        backLabel="Chart of accounts"
        actions={
          <Link href={`/account/ledger?accountId=${acc.id}`}>
            <Button>View ledger</Button>
          </Link>
        }
      />

      {balance.error ? (
        <ErrorState error={balance.error} onRetry={balance.reload} />
      ) : balance.loading ? (
        <Loading label="Loading balance..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Debit"
            value={formatCurrency(balance.data?.debitTotal)}
            hint="Posted entries only"
          />
          <StatCard
            label="Total Credit"
            value={formatCurrency(balance.data?.creditTotal)}
            hint="Posted entries only"
          />
          <StatCard
            label="Balance"
            value={formatCurrency(balance.data?.balance)}
            tone="indigo"
            hint={`Normal balance for ${titleCase(acc.type)}`}
          />
        </div>
      )}

      <Card className="mt-4" title="Account details" actions={<Badge status={acc.isActive ? 'ACTIVE' : 'INACTIVE'} />} bodyClassName="p-4">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Code</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{acc.code}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-0.5 text-slate-800">{acc.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Type</dt>
            <dd className="mt-0.5 text-slate-800">{titleCase(acc.type)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Parent</dt>
            <dd className="mt-0.5 text-slate-800">
              {acc.parent ? (
                <Link
                  href={`/account/chart-of-accounts/${acc.parent.id}`}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {acc.parent.code} - {acc.parent.name}
                </Link>
              ) : (
                '-'
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Sub-accounts" className="mt-4">
        {acc.children?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {acc.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/account/chart-of-accounts/${child.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-800">
                    {child.code} - {child.name}
                  </span>
                  <Badge status={child.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No sub-accounts"
            description="This account has no children in the hierarchy."
          />
        )}
      </Card>
    </div>
  );
}
