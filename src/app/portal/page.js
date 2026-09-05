'use client';

import Link from 'next/link';
import usePortalInvoices from '@/hooks/usePortalInvoices';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/format';

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const { invoices, loading, error, reload } = usePortalInvoices();

  if (loading) return <Loading label="Loading your account..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const outstanding = invoices.filter((invoice) => invoice.amountDue > 0);
  const paid = invoices.filter(
    (invoice) => invoice.status === 'PAID' || invoice.amountDue === 0,
  );
  const totalDue = outstanding.reduce((sum, invoice) => sum + invoice.amountDue, 0);

  const recentPayments = invoices
    .flatMap((invoice) =>
      (invoice.allocations ?? []).map((allocation) => ({
        id: allocation.id,
        invoiceNumber: invoice.number,
        invoiceId: invoice.id,
        amount: allocation.allocatedAmount,
        createdAt: allocation.createdAt,
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name || user?.loginId}`}
        subtitle="Your invoices and payments."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding invoices"
          value={outstanding.length}
          tone={outstanding.length > 0 ? 'amber' : 'green'}
        />
        <StatCard label="Paid invoices" value={paid.length} tone="green" />
        <StatCard
          label="Amount due"
          value={formatCurrency(totalDue)}
          tone={totalDue > 0 ? 'red' : 'green'}
        />
      </div>

      <Card
        title="Invoices to pay"
        className="mt-5"
        actions={
          <Link href="/portal/invoices" className="text-xs font-medium text-indigo-600">
            View all
          </Link>
        }
      >
        {outstanding.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Nothing due"
            description="You have no outstanding invoices."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {outstanding.slice(0, 5).map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/portal/invoices/${invoice.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{invoice.number}</p>
                    <p className="text-xs text-slate-500">
                      Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-amber-700">
                      {formatCurrency(invoice.amountDue)}
                    </p>
                    <Badge status={invoice.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Recent payments"
        className="mt-5"
        actions={
          <Link href="/portal/payments" className="text-xs font-medium text-indigo-600">
            View all
          </Link>
        }
      >
        {recentPayments.length === 0 ? (
          <EmptyState title="No payments yet" description="Your payments will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{payment.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{formatDate(payment.createdAt)}</p>
                </div>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(payment.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
