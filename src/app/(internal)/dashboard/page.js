'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { salesOrderService, invoiceService } from '@/services/sales.service';
import { purchaseOrderService, vendorBillService } from '@/services/purchase.service';
import reportService from '@/services/report.api';
import paymentService from '@/services/payment.api';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import BarChart, { SERIES } from '@/components/charts/BarChart';
import ColumnChart from '@/components/charts/ColumnChart';
import useMonthlyTrend from '@/hooks/useMonthlyTrend';
import { formatCurrency, formatDate, sumAllocations, sumLineTotals } from '@/utils/format';
import { sumAmounts } from '@/utils/money';
import { useAuth } from '@/context/AuthContext';

/* ── Inline SVG mini-bar chart for stat cards ──────────────────────────── */
function MiniBarChart({ values = [], color = '#8b5a32' }) {
  const max = Math.max(...values, 1);
  const barW = 5;
  const gap = 3;
  const h = 28;
  const w = values.length * (barW + gap) - gap;
  return (
    <svg width={w} height={h} aria-hidden="true" className="shrink-0">
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={1.5}
            fill={color}
            opacity={0.65 + 0.35 * (v / max)}
          />
        );
      })}
    </svg>
  );
}

/* ── Donut/Ring chart for invoice status ────────────────────────────────── */
function DonutChart({ segments = [], size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const strokeW = 18;
  const circumference = 2 * Math.PI * r;

  const segmentsWithOffset = segments.reduce((acc, seg) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].endOffset : 0;
    const pct = seg.value / total;
    acc.push({ ...seg, pct, startOffset: prevOffset, endOffset: prevOffset + pct });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5f1ea" strokeWidth={strokeW} />
      {segmentsWithOffset.map((seg, i) => {
        const dashLen = seg.pct * circumference;
        const dashOffset = -seg.startOffset * circumference;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          >
            <title>{seg.label}: {seg.value}</title>
          </circle>
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1c1917">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#78716c">
        Total
      </text>
    </svg>
  );
}

/* ── Real month-over-month delta, or a quiet note when there is no baseline ── */
function DeltaLabel({ value }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-xs font-medium text-stone-400">No prior month to compare</span>;
  }
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {up ? '+' : ''}{value.toFixed(0)}% from last month
    </span>
  );
}

/* ── Motivational quotes ────────────────────────────────────────────────── */
const QUOTES = [
  { text: '"Accurate accounts,\nstronger businesses."', author: 'Urban Furniture' },
];

/** Value of documents dated inside a given calendar month offset from now. */
function monthValue(documents, dateField, offset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return documents.reduce((sum, doc) => {
    if (doc.status === 'CANCELLED') return sum;
    const date = new Date(doc[dateField]);
    if (Number.isNaN(date.getTime())) return sum;
    if (date.getFullYear() !== target.getFullYear() || date.getMonth() !== target.getMonth()) {
      return sum;
    }
    return sum + sumLineTotals(doc.lines);
  }, 0);
}

/** Last six months of real document value, oldest first - for the sparklines. */
function monthlySeries(documents, dateField, months = 6) {
  return Array.from({ length: months }, (_, i) => monthValue(documents, dateField, months - 1 - i));
}

/**
 * Real month-over-month change. Returns null when last month had nothing to
 * compare against, so the card can stay silent instead of inventing a number.
 */
function monthOverMonth(series) {
  if (series.length < 2) return null;
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculates totals from a list of documents (invoices or bills)
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

/** Status counts */
function getStatusCounts(documents, states) {
  return states.map((status) => ({
    label: status.label,
    count: documents.filter((doc) => doc.status === status.key).length,
    color: status.color,
  }));
}

export default function DashboardPage() {
  const { user } = useAuth();

  const orders = useApiResource(() => salesOrderService.list(), []);
  const invoices = useApiResource(() => invoiceService.list(), []);
  const purchaseOrders = useApiResource(() => purchaseOrderService.list(), []);
  const bills = useApiResource(() => vendorBillService.list(), []);
  const profitLoss = useApiResource(() => reportService.profitAndLoss(), []);
  const payments = useApiResource(() => paymentService.list(), []);
  // Real per-month income/expenses, one backend P&L call per month.
  const trend = useMonthlyTrend(6);

  const soRows = useMemo(() => orders.data ?? [], [orders.data]);
  const invoiceRows = useMemo(() => invoices.data ?? [], [invoices.data]);
  const poRows = useMemo(() => purchaseOrders.data ?? [], [purchaseOrders.data]);
  const billRows = useMemo(() => bills.data ?? [], [bills.data]);
  const paymentRows = useMemo(() => payments.data ?? [], [payments.data]);

  const quote = QUOTES[0];

  const loading =
    orders.loading || invoices.loading || purchaseOrders.loading || bills.loading || payments.loading;
  const error = orders.error || invoices.error || purchaseOrders.error || bills.error || payments.error;

  const reloadAll = () => {
    orders.reload();
    invoices.reload();
    purchaseOrders.reload();
    bills.reload();
    profitLoss.reload();
    payments.reload();
  };

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={reloadAll} />;

  // Real six-month series straight off the documents the backend returned.
  const invoicedSeries = monthlySeries(invoiceRows, 'invoiceDate');
  const billedSeries = monthlySeries(billRows, 'billDate');
  const paidSeries = trend.months.map((m) => m.income);
  const invoicedDelta = monthOverMonth(invoicedSeries);
  const billedDelta = monthOverMonth(billedSeries);

  const receivables = documentTotals(invoiceRows);
  const payables = documentTotals(billRows);
  const pnl = profitLoss.data;

  // Recent Invoices & Payments
  const recentInvoices = [...invoiceRows]
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .slice(0, 5);
  
  const recentPayments = [...paymentRows]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Status segments for donut
  const partiallyPaidCount = invoiceRows.filter((inv) => inv.status === 'PARTIALLY_PAID').length;
  const paidCount = invoiceRows.filter((inv) => inv.status === 'PAID').length;
  const overdueCount = invoiceRows.filter((inv) => {
    if (!inv.dueDate || inv.status === 'PAID' || inv.status === 'CANCELLED' || inv.status === 'DRAFT') return false;
    return new Date(inv.dueDate) < new Date();
  }).length;
  
  const donutSegments = [
    { label: 'Paid', value: paidCount, color: '#16a34a' },
    { label: 'Partially Paid', value: partiallyPaidCount, color: '#f59e0b' },
    { label: 'Overdue', value: overdueCount, color: '#dc2626' },
  ].filter((s) => s.value > 0);
  if (donutSegments.length === 0 && invoiceRows.length > 0) {
    donutSegments.push({ label: 'Pending', value: invoiceRows.length, color: '#f59e0b' });
  }

  // Top Customers
  const debtors = topOutstanding(invoiceRows);

  // Sales Order Counts
  const soCounts = getStatusCounts(soRows, [
    { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-emerald-500' },
    { key: 'DRAFT', label: 'Draft', color: 'bg-amber-500' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
  ]);

  // Purchase Order Counts
  const poCounts = getStatusCounts(poRows, [
    { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-emerald-500' },
    { key: 'DRAFT', label: 'Draft', color: 'bg-amber-500' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
  ]);

  return (
    <div className="portal-dashboard max-w-7xl mx-auto pb-10">
      {/* ── Hero / Greeting ──────────────────────────────────────────────── */}
      <div className="portal-hero mt-4">
        <div>
          <h1 className="portal-hero-title">Welcome back, {user?.name || 'System Accountant'} 👋</h1>
          <p className="portal-hero-subtitle">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="flex items-start gap-8">
          <div className="portal-quote hidden md:block">
            <p className="portal-quote-text">{quote.text}</p>
            <span className="portal-quote-author">&mdash; {quote.author}</span>
          </div>
          <div className="flex gap-3">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-lg text-sm font-medium text-stone-700">
              📅 Sep 1, 2026 - Sep 30, 2026 <span>⌄</span>
            </div>
            <Link href="/sales/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition shadow-sm">
              + New Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="portal-stats-grid">
        <div className="portal-stat-tile">
          <div className="portal-stat-top">
            <div className="portal-stat-icon bg-amber-100 text-amber-600">🧾</div>
            <div className="portal-stat-info">
              <span className="portal-stat-label">Total Invoiced</span>
              <span className="portal-stat-value">{formatCurrency(receivables.total)}</span>
            </div>
          </div>
          <div className="portal-stat-bottom items-center justify-between">
            <DeltaLabel value={invoicedDelta} />
            <MiniBarChart values={invoicedSeries} color="#d97706" />
          </div>
        </div>

        <div className="portal-stat-tile">
          <div className="portal-stat-top">
            <div className="portal-stat-icon bg-orange-100 text-orange-600">⏳</div>
            <div className="portal-stat-info">
              <span className="portal-stat-label">Receivable (Outstanding)</span>
              <span className="portal-stat-value">{formatCurrency(receivables.outstanding)}</span>
            </div>
          </div>
          <div className="portal-stat-bottom items-center justify-between">
            <DeltaLabel value={invoicedDelta} />
            <MiniBarChart values={invoicedSeries} color="#ea580c" />
          </div>
        </div>

        <div className="portal-stat-tile">
          <div className="portal-stat-top">
            <div className="portal-stat-icon bg-emerald-100 text-emerald-600">💵</div>
            <div className="portal-stat-info">
              <span className="portal-stat-label">Paid (Received)</span>
              <span className="portal-stat-value">{formatCurrency(receivables.paid)}</span>
            </div>
          </div>
          <div className="portal-stat-bottom items-center justify-between">
            <DeltaLabel value={monthOverMonth(paidSeries)} />
            <MiniBarChart values={paidSeries} color="#059669" />
          </div>
        </div>

        <div className="portal-stat-tile">
          <div className="portal-stat-top">
            <div className="portal-stat-icon bg-rose-100 text-rose-600">💳</div>
            <div className="portal-stat-info">
              <span className="portal-stat-label">Payable (Bills)</span>
              <span className="portal-stat-value">{formatCurrency(payables.outstanding)}</span>
            </div>
          </div>
          <div className="portal-stat-bottom items-center justify-between">
            <DeltaLabel value={billedDelta} />
            <MiniBarChart values={billedSeries} color="#e11d48" />
          </div>
        </div>
      </div>

      {/* ── Mid Grid: PNL + Donut + Actions ──────────────────────────────── */}
      <div className="portal-mid-grid">
        {/* PNL Bar Chart */}
        <div className="portal-card flex flex-col">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">Income vs Expenses</h2>
              <p className="portal-card-subtitle">Posted journal entries (Last 6 months)</p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-stone-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-600"></span> Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300"></span> Expenses</span>
              <span className="ml-2 px-2 py-1 bg-stone-100 rounded">Last 6 months ⌄</span>
            </div>
          </div>
          <div className="portal-overview-chart flex-1 p-2">
            {trend.loading ? (
              <Loading label="Loading monthly figures..." />
            ) : trend.error ? (
              <ErrorState error={trend.error} onRetry={trend.reload} />
            ) : (
              /* One backend P&L call per month - real income and expenses, never scaled. */
              <ColumnChart
                rows={trend.months.map((month) => ({
                  label: month.label,
                  values: [month.income, month.expenses],
                }))}
                series={[
                  { name: 'Income', color: SERIES.terracotta },
                  { name: 'Expenses', color: '#d6b593' },
                ]}
                emptyMessage="No posted journal entries in the last six months."
              />
            )}
          </div>
        </div>

        {/* Invoice Status Donut */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">Invoice Status</h2>
              <p className="portal-card-subtitle">Customer invoices by state</p>
            </div>
            <span className="text-xs font-medium bg-stone-100 px-2 py-1 rounded">This Month ⌄</span>
          </div>
          <div className="portal-donut-body">
            <DonutChart segments={donutSegments} />
            <ul className="portal-donut-legend flex-1">
              {donutSegments.map((seg, i) => (
                <li key={i} className="portal-donut-legend-item justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="portal-legend-dot" style={{ backgroundColor: seg.color }}></span>
                    <span className="portal-donut-legend-label">{seg.label}</span>
                  </div>
                  <span className="portal-donut-legend-value">
                    {seg.value} <span className="text-stone-400 font-normal">({Math.round(seg.value/invoiceRows.length*100)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="portal-card portal-quick-card flex flex-col">
          <div className="portal-card-header">
            <h2 className="portal-card-title flex items-center gap-2">⚡ Quick Actions</h2>
          </div>
          <div className="portal-quick-actions flex-1 justify-center py-4">
            <Link href="/sales/customers/new" className="portal-quick-btn">
              <span className="portal-quick-icon">＋</span> New Customer
            </Link>
            <Link href="/purchase/vendors/new" className="portal-quick-btn">
              <span className="portal-quick-icon">＋</span> New Vendor
            </Link>
            <Link href="/sales/invoices/new" className="portal-quick-btn">
              <span className="portal-quick-icon">＋</span> New Invoice
            </Link>
            <Link href="/purchase/bills/new" className="portal-quick-btn">
              <span className="portal-quick-icon">＋</span> New Bill
            </Link>
            <Link href="/sales/receipts" className="portal-quick-btn">
              <span className="portal-quick-icon">💳</span> Record Payment
            </Link>
            <Link href="/reports" className="portal-quick-btn">
              <span className="portal-quick-icon">📊</span> View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Outstanding + Pipeline ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Top Outstanding */}
        <div className="portal-card lg:col-span-2">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">Top Outstanding Customers</h2>
              <p className="portal-card-subtitle">Amount still due, largest first</p>
            </div>
            <Link href="/sales/invoices" className="portal-view-all">View all &rarr;</Link>
          </div>
          <div className="p-4">
            {debtors.length === 0 ? (
              <EmptyState title="All clear!" description="No outstanding invoices found." />
            ) : (
              <ul className="space-y-4 py-2">
                {debtors.map((d, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">{i+1}</span>
                    <span className="text-sm font-medium text-stone-700 w-1/3 truncate">{d.label}</span>
                    <div className="flex-1 bg-stone-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-brand-600 h-full rounded-full" style={{ width: `${Math.max(10, (d.value / debtors[0].value) * 100)}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-stone-900 w-24 text-right">{formatCurrency(d.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sales Orders */}
        <div className="portal-card flex flex-col">
          <div className="portal-card-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">🛒</div>
              <div>
                <h2 className="portal-card-title">Sales Orders</h2>
                <p className="portal-card-subtitle"><span className="text-lg font-bold text-stone-900">{soRows.length}</span> Total Orders</p>
              </div>
            </div>
            <Link href="/sales/orders" className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition">&rarr;</Link>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center gap-3">
            {soCounts.map((sc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <span className={`w-2 h-2 rounded-full ${sc.color}`}></span>
                  {sc.count} <span className="text-stone-500">{sc.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="portal-card flex flex-col">
          <div className="portal-card-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center text-stone-600">📦</div>
              <div>
                <h2 className="portal-card-title">Purchase Orders</h2>
                <p className="portal-card-subtitle"><span className="text-lg font-bold text-stone-900">{poRows.length}</span> Total Orders</p>
              </div>
            </div>
            <Link href="/purchase/orders" className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition">&rarr;</Link>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center gap-3">
            {poCounts.map((pc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <span className={`w-2 h-2 rounded-full ${pc.color}`}></span>
                  {pc.count} <span className="text-stone-500">{pc.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Grid: Invoices + Payments ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        {/* Recent Invoices */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Recent Customer Invoices</h2>
            <Link href="/sales/invoices" className="portal-view-all">View all &rarr;</Link>
          </div>
          <div className="table-scroll overflow-x-auto">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-stone-500">No invoices yet</td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="portal-table-inv-no">
                        <Link href={`/sales/invoices/${inv.id}`} className="hover:underline">{inv.number}</Link>
                      </td>
                      <td>{inv.customer?.name}</td>
                      <td>{formatDate(inv.invoiceDate)}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td className="font-medium text-stone-900">{formatCurrency(sumLineTotals(inv.lines))}</td>
                      <td><Badge status={inv.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Recent Payments</h2>
            <Link href="/sales/receipts" className="portal-view-all">View all &rarr;</Link>
          </div>
          <div className="table-scroll overflow-x-auto">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Customer/Vendor</th>
                  <th>Amount</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-stone-500">No payments yet</td>
                  </tr>
                ) : (
                  recentPayments.map((pay) => (
                    <tr key={pay.id}>
                      <td>{formatDate(pay.createdAt)}</td>
                      <td className="portal-table-inv-no">{pay.number}</td>
                      <td className="truncate max-w-[120px]">{pay.partner?.name}</td>
                      <td className="font-medium text-stone-900">{formatCurrency(pay.amount)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${pay.partnerType === 'CUSTOMER' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {pay.partnerType}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
