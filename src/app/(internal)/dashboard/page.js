'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { salesOrderService, invoiceService } from '@/services/sales.service';
import { purchaseOrderService, vendorBillService } from '@/services/purchase.service';
import reportService from '@/services/report.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import BarChart, { SERIES } from '@/components/charts/BarChart';
import AreaLineChart from '@/components/charts/AreaLineChart';
import { formatCurrency, formatDate, sumAllocations, sumLineTotals } from '@/utils/format';
import { sumAmounts } from '@/utils/money';
import { useAuth } from '@/context/AuthContext';

/**
 * Every figure below aggregates values the backend returned - line totals it
 * computed and allocations it recorded. Nothing is re-priced or invented here.
 */
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

const MONTH_LABEL = (date) =>
  date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

/** Last six calendar months of invoiced vs billed value. */
function monthlyTrend(invoices, bills) {
  const buckets = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${date.getFullYear()}-${date.getMonth()}`, label: MONTH_LABEL(date), invoiced: [], billed: [] });
  }
  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const add = (documents, dateField, target) => {
    documents.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const date = new Date(doc[dateField]);
      if (Number.isNaN(date.getTime())) return;
      const bucket = index.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (bucket) bucket[target].push(sumLineTotals(doc.lines));
    });
  };

  add(invoices, 'invoiceDate', 'invoiced');
  add(bills, 'billDate', 'billed');

  return buckets.map((bucket) => ({
    label: bucket.label,
    values: [sumAmounts(bucket.invoiced), sumAmounts(bucket.billed)],
  }));
}

function statusMix(documents) {
  const order = ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];
  const counts = new Map(order.map((status) => [status, 0]));
  documents.forEach((doc) => {
    if (counts.has(doc.status)) counts.set(doc.status, counts.get(doc.status) + 1);
  });
  return order
    .map((status) => ({ label: status.replace(/_/g, ' '), value: counts.get(status) }))
    .filter((row) => row.value > 0);
}

/** Customers with the most money still owed, largest first. */
function topOutstanding(invoices, limit = 5) {
  const byCustomer = new Map();
  invoices.forEach((invoice) => {
    if (['CANCELLED', 'DRAFT'].includes(invoice.status)) return;
    const due = Math.max(sumLineTotals(invoice.lines) - sumAllocations(invoice.allocations), 0);
    if (due <= 0) return;
    const name = invoice.customer?.name || 'Unknown';
    byCustomer.set(name, (byCustomer.get(name) || 0) + due);
  });
  return [...byCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export default function DashboardPage() {
  const { user } = useAuth();

  const orders = useApiResource(() => salesOrderService.list(), []);
  const invoices = useApiResource(() => invoiceService.list(), []);
  const purchaseOrders = useApiResource(() => purchaseOrderService.list(), []);
  const bills = useApiResource(() => vendorBillService.list(), []);
  const profitLoss = useApiResource(() => reportService.profitAndLoss(), []);

  const soRows = useMemo(() => orders.data ?? [], [orders.data]);
  const invoiceRows = useMemo(() => invoices.data ?? [], [invoices.data]);
  const poRows = useMemo(() => purchaseOrders.data ?? [], [purchaseOrders.data]);
  const billRows = useMemo(() => bills.data ?? [], [bills.data]);

  const trend = useMemo(() => monthlyTrend(invoiceRows, billRows), [invoiceRows, billRows]);
  const invoiceMix = useMemo(() => statusMix(invoiceRows), [invoiceRows]);
  const debtors = useMemo(() => topOutstanding(invoiceRows), [invoiceRows]);

  const loading =
    orders.loading || invoices.loading || purchaseOrders.loading || bills.loading;
  const error = orders.error || invoices.error || purchaseOrders.error || bills.error;

  const reloadAll = () => {
    orders.reload();
    invoices.reload();
    purchaseOrders.reload();
    bills.reload();
    profitLoss.reload();
  };

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  const receivables = documentTotals(invoiceRows);
  const payables = documentTotals(billRows);
  const pnl = profitLoss.data;

  const recentInvoices = [...invoiceRows]
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome, ${user?.name || user?.loginId}`}
        subtitle="Live figures from the accounting backend."
        actions={
          <>
            <Link href="/sales/invoices/new">
              <Button variant="secondary">New invoice</Button>
            </Link>
            <Link href="/sales/orders/new">
              <Button>New sales order</Button>
            </Link>
          </>
        }
      />

      {/* ---------------- headline figures ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={formatCurrency(receivables.total)}
          hint={`${invoiceRows.length} customer invoices`}
          icon="🧾"
        />
        <StatCard
          label="Receivable"
          value={formatCurrency(receivables.outstanding)}
          tone="amber"
          hint="Confirmed invoices not yet fully paid"
          icon="⏳"
        />
        <StatCard
          label="Billed"
          value={formatCurrency(payables.total)}
          hint={`${billRows.length} vendor bills`}
          icon="📄"
        />
        <StatCard
          label="Payable"
          value={formatCurrency(payables.outstanding)}
          tone="red"
          hint="Confirmed bills not yet fully paid"
          icon="💳"
        />
      </div>

      {/* ---------------- KPI graphs ---------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Invoiced vs billed"
          subtitle="Document value per month, last 6 months"
          className="lg:col-span-2"
        >
          <AreaLineChart
            rows={trend}
            series={[
              { name: 'Invoiced', color: SERIES.terracotta },
              { name: 'Billed', color: SERIES.teal },
            ]}
            emptyMessage="No invoices or bills dated in the last six months."
          />
        </Card>

        <Card title="Income vs expenses" subtitle="Posted journal entries (profit & loss)">
          {profitLoss.loading ? (
            <Loading label="Loading profit and loss..." />
          ) : profitLoss.error ? (
            <ErrorState error={profitLoss.error} onRetry={profitLoss.reload} />
          ) : (
            <>
              <BarChart
                rows={[
                  { label: 'Income', value: pnl?.totalIncome },
                  { label: 'Expenses', value: pnl?.totalExpenses },
                ]}
                series={[{ name: 'Amount', color: SERIES.teal }]}
                emptyMessage="No posted journal entries yet."
              />
              <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
                <span className="text-sm font-medium text-stone-600">Net income</span>
                <span
                  className={`text-base font-semibold tabular ${
                    Number(pnl?.netIncome ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(pnl?.netIncome)}
                </span>
              </div>
            </>
          )}
        </Card>

        <Card title="Invoice status mix" subtitle="Customer invoices by state">
          <BarChart
            rows={invoiceMix}
            series={[{ name: 'Invoices', color: SERIES.teal }]}
            valueFormatter={(v) => String(v)}
            tooltipFormatter={(v) => `${v} invoice(s)`}
            emptyMessage="No invoices yet."
          />
        </Card>

        <Card
          title="Top outstanding customers"
          subtitle="Amount still due, largest first"
          className="lg:col-span-2"
          actions={
            <Link href="/sales/receipts" className="text-xs font-medium text-brand-600">
              Record a receipt
            </Link>
          }
        >
          <BarChart
            rows={debtors}
            series={[{ name: 'Amount due', color: SERIES.terracotta }]}
            emptyMessage="Nothing outstanding - every confirmed invoice is fully paid."
          />
        </Card>
      </div>

      {/* ---------------- pipeline counters ---------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Sales orders"
          actions={
            <Link href="/sales/orders/new">
              <Button size="sm">New</Button>
            </Link>
          }
          bodyClassName="grid grid-cols-3 divide-x divide-stone-100"
        >
          <Link href="/sales/orders" className="p-4 text-center transition hover:bg-stone-50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">All</p>
            <p className="mt-1 text-2xl font-semibold tabular text-stone-900">{soRows.length}</p>
          </Link>
          <Link
            href="/sales/orders?status=CONFIRMED"
            className="p-4 text-center transition hover:bg-stone-50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Confirmed
            </p>
            <p className="mt-1 text-2xl font-semibold tabular text-emerald-600">
              {soRows.filter((row) => row.status === 'CONFIRMED').length}
            </p>
          </Link>
          <Link
            href="/sales/orders?status=DRAFT"
            className="p-4 text-center transition hover:bg-stone-50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Draft</p>
            <p className="mt-1 text-2xl font-semibold tabular text-stone-600">
              {soRows.filter((row) => row.status === 'DRAFT').length}
            </p>
          </Link>
        </Card>

        <Card
          title="Purchase orders"
          actions={
            <Link href="/purchase/orders/new">
              <Button size="sm">New</Button>
            </Link>
          }
          bodyClassName="grid grid-cols-3 divide-x divide-stone-100"
        >
          <Link href="/purchase/orders" className="p-4 text-center transition hover:bg-stone-50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">All</p>
            <p className="mt-1 text-2xl font-semibold tabular text-stone-900">{poRows.length}</p>
          </Link>
          <Link
            href="/purchase/orders?status=CONFIRMED"
            className="p-4 text-center transition hover:bg-stone-50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Confirmed
            </p>
            <p className="mt-1 text-2xl font-semibold tabular text-emerald-600">
              {poRows.filter((row) => row.status === 'CONFIRMED').length}
            </p>
          </Link>
          <Link
            href="/purchase/orders?status=DRAFT"
            className="p-4 text-center transition hover:bg-stone-50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Draft</p>
            <p className="mt-1 text-2xl font-semibold tabular text-stone-600">
              {poRows.filter((row) => row.status === 'DRAFT').length}
            </p>
          </Link>
        </Card>
      </div>

      {/* ---------------- recent activity ---------------- */}
      <Card
        title="Recent customer invoices"
        className="mt-4"
        actions={
          <Link href="/sales/invoices" className="text-xs font-medium text-brand-600">
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
          <ul className="divide-y divide-stone-100">
            {recentInvoices.map((invoice) => {
              const total = sumLineTotals(invoice.lines);
              const paid = sumAllocations(invoice.allocations);
              return (
                <li key={invoice.id}>
                  <Link
                    href={`/sales/invoices/${invoice.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-stone-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900">{invoice.number}</p>
                      <p className="text-xs text-stone-500">
                        {invoice.customer?.name} &middot; {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium tabular text-stone-900">
                          {formatCurrency(total)}
                        </p>
                        <p className="text-xs tabular text-stone-500">
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
