'use client';

import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { salesOrderService, invoiceService } from '@/services/sales.service';
import { purchaseOrderService, vendorBillService } from '@/services/purchase.service';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, sumAllocations, sumLineTotals } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';

/** All figures below aggregate values the backend returned. Nothing is invented. */
function documentTotals(documents) {
  return documents.reduce(
    (acc, doc) => {
      const total = sumLineTotals(doc.lines);
      const paid = sumAllocations(doc.allocations);
      acc.total += total;
      acc.paid += paid;
      if (!['CANCELLED', 'DRAFT'].includes(doc.status)) {
        acc.outstanding += Math.max(total - paid, 0);
      }
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0 },
  );
}

function countByStatus(rows, status) {
  return rows.filter((row) => row.status === status).length;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const orders = useApiResource(() => salesOrderService.list(), []);
  const invoices = useApiResource(() => invoiceService.list(), []);
  const purchaseOrders = useApiResource(() => purchaseOrderService.list(), []);
  const bills = useApiResource(() => vendorBillService.list(), []);

  const loading =
    orders.loading || invoices.loading || purchaseOrders.loading || bills.loading;
  const error = orders.error || invoices.error || purchaseOrders.error || bills.error;

  const reloadAll = () => {
    orders.reload();
    invoices.reload();
    purchaseOrders.reload();
    bills.reload();
  };

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  const soRows = orders.data ?? [];
  const invoiceRows = invoices.data ?? [];
  const poRows = purchaseOrders.data ?? [];
  const billRows = bills.data ?? [];

  const receivables = documentTotals(invoiceRows);
  const payables = documentTotals(billRows);

  const recentInvoices = [...invoiceRows]
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name || user?.loginId}`}
        subtitle="Live figures from the accounting backend."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={formatCurrency(receivables.total)}
          hint={`${invoiceRows.length} customer invoices`}
        />
        <StatCard
          label="Receivable"
          value={formatCurrency(receivables.outstanding)}
          tone="amber"
          hint="Confirmed invoices not yet fully paid"
        />
        <StatCard
          label="Billed"
          value={formatCurrency(payables.total)}
          hint={`${billRows.length} vendor bills`}
        />
        <StatCard
          label="Payable"
          value={formatCurrency(payables.outstanding)}
          tone="red"
          hint="Confirmed bills not yet fully paid"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Sales"
          actions={
            <Link href="/sales/orders/new">
              <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                New
              </span>
            </Link>
          }
          bodyClassName="grid grid-cols-3 divide-x divide-slate-100"
        >
          <Link href="/sales/orders" className="p-4 text-center hover:bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">All</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{soRows.length}</p>
          </Link>
          <Link href="/sales/orders?status=CONFIRMED" className="p-4 text-center hover:bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confirmed</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">
              {countByStatus(soRows, 'CONFIRMED')}
            </p>
          </Link>
          <Link href="/sales/orders?status=DRAFT" className="p-4 text-center hover:bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">Draft</p>
            <p className="mt-1 text-xl font-semibold text-slate-600">
              {countByStatus(soRows, 'DRAFT')}
            </p>
          </Link>
        </Card>

        <Card
          title="Purchase"
          actions={
            <Link href="/purchase/orders/new">
              <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                New
              </span>
            </Link>
          }
          bodyClassName="grid grid-cols-3 divide-x divide-slate-100"
        >
          <Link href="/purchase/orders" className="p-4 text-center hover:bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">All</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{poRows.length}</p>
          </Link>
          <Link
            href="/purchase/orders?status=CONFIRMED"
            className="p-4 text-center hover:bg-slate-50"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Confirmed</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">
              {countByStatus(poRows, 'CONFIRMED')}
            </p>
          </Link>
          <Link href="/purchase/orders?status=DRAFT" className="p-4 text-center hover:bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">Draft</p>
            <p className="mt-1 text-xl font-semibold text-slate-600">
              {countByStatus(poRows, 'DRAFT')}
            </p>
          </Link>
        </Card>
      </div>

      <Card
        title="Recent customer invoices"
        className="mt-5"
        actions={
          <Link href="/sales/invoices" className="text-xs font-medium text-indigo-600">
            View all
          </Link>
        }
      >
        {recentInvoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Customer invoices you create will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentInvoices.map((invoice) => {
              const total = sumLineTotals(invoice.lines);
              const paid = sumAllocations(invoice.allocations);
              return (
                <li key={invoice.id}>
                  <Link
                    href={`/sales/invoices/${invoice.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{invoice.number}</p>
                      <p className="text-xs text-slate-500">
                        {invoice.customer?.name} &middot; {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-800">
                          {formatCurrency(total)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due {formatCurrency(Math.max(total - paid, 0))}
                        </p>
                      </div>
                      <Badge status={invoice.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
