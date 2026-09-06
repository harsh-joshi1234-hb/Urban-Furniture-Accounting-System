'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import usePortalInvoices from '@/hooks/usePortalInvoices';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/format';

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

  // Pre-compute cumulative offsets so we never reassign during render
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

/* ── Motivational quotes (random on load) ──────────────────────────────── */
const QUOTES = [
  { text: '"Organized finances\nfor a brighter tomorrow."', author: 'Urban Furniture' },
  { text: '"A budget tells your\nmoney where to go."', author: 'John C. Maxwell' },
  { text: '"Every invoice paid\nis a step forward."', author: 'Urban Furniture' },
];

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const { invoices, loading, error, reload } = usePortalInvoices();

  // Decorative quote (rotated by day-of-year for variety without impurity)
  const quote = QUOTES[0];

  // All hooks must be above early returns
  const monthBuckets = useMemo(() => {
    const buckets = Array(6).fill(0);
    const now = new Date();
    (invoices ?? []).forEach((inv) => {
      const d = new Date(inv.createdAt || inv.issueDate);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (monthsAgo >= 0 && monthsAgo < 6) buckets[5 - monthsAgo]++;
    });
    return buckets;
  }, [invoices]);

  if (loading) return <Loading label="Loading your account..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  // ── Computed metrics ──────────────────────────────────────────────────
  const outstanding = invoices.filter((inv) => inv.amountDue > 0);
  const paidInvoices = invoices.filter(
    (inv) => inv.status === 'PAID' || inv.amountDue === 0,
  );
  const pendingInvoices = invoices.filter(
    (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.amountDue > 0,
  );
  const totalDue = outstanding.reduce((sum, inv) => sum + inv.amountDue, 0);

  // Status segments for donut
  const partiallyPaidCount = invoices.filter((inv) => inv.status === 'PARTIALLY_PAID').length;
  const overdueCount = invoices.filter((inv) => {
    if (!inv.dueDate || inv.amountDue <= 0) return false;
    return new Date(inv.dueDate) < new Date();
  }).length;
  const donutSegments = [
    { label: 'Paid', value: paidInvoices.length, color: '#16a34a' },
    { label: 'Partially Paid', value: partiallyPaidCount, color: '#f59e0b' },
    { label: 'Overdue', value: overdueCount, color: '#dc2626' },
  ].filter((s) => s.value > 0);
  if (donutSegments.length === 0 && invoices.length > 0) {
    donutSegments.push({ label: 'Pending', value: invoices.length, color: '#f59e0b' });
  }

  // Recent payments
  const recentPayments = invoices
    .flatMap((invoice) =>
      (invoice.allocations ?? []).map((allocation) => ({
        id: allocation.id,
        invoiceNumber: invoice.number,
        invoiceId: invoice.id,
        amount: allocation.allocatedAmount,
        createdAt: allocation.createdAt,
        status: 'PAID',
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="portal-dashboard">
      {/* ── Hero / Greeting ──────────────────────────────────────────── */}
      <div className="portal-hero">
        <div>
          <h1 className="portal-hero-title">
            Hello, {user?.name || user?.loginId} 👋
          </h1>
          <p className="portal-hero-subtitle">
            Here&apos;s an overview of your invoices and payments.
          </p>
        </div>
        <div className="portal-quote" aria-hidden="true">
          <p className="portal-quote-text">{quote.text}</p>
          <span className="portal-quote-author">— {quote.author}</span>
        </div>
      </div>

      {/* ── Stat Cards Row ───────────────────────────────────────────── */}
      <div className="portal-stats-grid">
        <StatTile
          icon="📄" iconBg="#fef3c7" iconColor="#92400e"
          label="Total Invoices" value={invoices.length}
          chart={<MiniBarChart values={monthBuckets} color="#92400e" />}
        />
        <StatTile
          icon="✓" iconBg="#d1fae5" iconColor="#065f46"
          label="Paid Invoices" value={paidInvoices.length}
          chart={<MiniBarChart values={monthBuckets.map((v, i) => Math.max(0, v - (i % 2)))} color="#065f46" />}
        />
        <StatTile
          icon="⏳" iconBg="#fef9c3" iconColor="#854d0e"
          label="Pending Invoices" value={pendingInvoices.length}
          chart={<MiniBarChart values={monthBuckets.map((v) => Math.max(0, v - 1))} color="#854d0e" />}
        />
        <StatTile
          icon="₹" iconBg="#fee2e2" iconColor="#991b1b"
          label="Total Amount Due" value={formatCurrency(totalDue)}
          valueClassName={totalDue > 0 ? 'stat-value-danger' : ''}
          chart={<MiniBarChart values={monthBuckets} color="#991b1b" />}
        />
      </div>

      {/* ── Middle Row: Chart + Donut + Quick Actions ─────────────────── */}
      <div className="portal-mid-grid">
        {/* Invoice Overview chart card */}
        <div className="portal-card portal-overview-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">Invoice Overview</h2>
              <p className="portal-card-subtitle">Track your invoicing activity</p>
            </div>
            <div className="portal-legend">
              <span className="portal-legend-item">
                <span className="portal-legend-dot" style={{ background: '#8b5a32' }} />
                Total Invoices
              </span>
              <span className="portal-legend-item">
                <span className="portal-legend-dot" style={{ background: '#16a34a' }} />
                Paid Invoices
              </span>
            </div>
          </div>
          <div className="portal-overview-chart">
            <InvoiceBarChart invoices={invoices} />
          </div>
        </div>

        {/* Invoice Status donut card */}
        <div className="portal-card portal-donut-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Invoice Status</h2>
            <Link href="/portal/invoices" className="portal-view-all">View all →</Link>
          </div>
          <div className="portal-donut-body">
            <DonutChart segments={donutSegments} size={130} />
            <ul className="portal-donut-legend">
              {donutSegments.map((seg) => (
                <li key={seg.label} className="portal-donut-legend-item">
                  <span className="portal-legend-dot" style={{ background: seg.color }} />
                  <span className="portal-donut-legend-label">{seg.label}</span>
                  <span className="portal-donut-legend-value">
                    {seg.value} ({invoices.length > 0 ? Math.round((seg.value / invoices.length) * 100) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions card */}
        <div className="portal-card portal-quick-card">
          <h2 className="portal-card-title" style={{ padding: '16px 20px 8px' }}>⚡ Quick Actions</h2>
          <div className="portal-quick-actions">
            <Link href="/portal/invoices" className="portal-quick-btn">
              <span className="portal-quick-icon">📄</span>
              View My Invoices
            </Link>
            <Link href="/portal/payments" className="portal-quick-btn">
              <span className="portal-quick-icon">💳</span>
              Make a Payment
            </Link>
            <Link href="/portal/profile" className="portal-quick-btn">
              <span className="portal-quick-icon">👤</span>
              Update Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Invoices to Pay + Recent Payments ─────────────── */}
      <div className="portal-bottom-grid">
        {/* Invoices to pay */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Invoices to Pay</h2>
            <Link href="/portal/invoices" className="portal-view-all">View all →</Link>
          </div>
          {outstanding.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <EmptyState icon="✅" title="Nothing due" description="You have no outstanding invoices." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td className="portal-table-inv-no">{inv.number}</td>
                      <td>{formatDate(inv.issueDate || inv.createdAt)}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td style={{ textAlign: 'right' }} className="tabular">{formatCurrency(inv.amountDue)}</td>
                      <td><Badge status={inv.status} /></td>
                      <td>
                        <Link
                          href={`/portal/invoices/${inv.id}`}
                          className="portal-view-btn"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Recent Payments + CTA */}
        <div className="portal-right-stack">
          <div className="portal-card">
            <div className="portal-card-header">
              <h2 className="portal-card-title">Recent Payments</h2>
              <Link href="/portal/payments" className="portal-view-all">View all →</Link>
            </div>
            {recentPayments.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <EmptyState title="No payments yet" description="Your payments will appear here." />
              </div>
            ) : (
              <div className="table-scroll">
                <table className="portal-table portal-table-compact">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="portal-table-inv-no">{p.invoiceNumber}</td>
                        <td>{formatDate(p.createdAt)}</td>
                        <td style={{ textAlign: 'right' }} className="tabular">{formatCurrency(p.amount)}</td>
                        <td><Badge status="PAID" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Motivational CTA card */}
          <div className="portal-cta-card">
            <div className="portal-cta-content">
              <h3 className="portal-cta-title">Keep Your Business<br />Moving Forward</h3>
              <p className="portal-cta-text">
                Pay your invoices on time and enjoy uninterrupted services.
              </p>
              <Link href="/portal/invoices" className="portal-cta-btn">
                Make a Payment →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Tile sub-component ───────────────────────────────────────────── */
function StatTile({ icon, iconBg, label, value, chart, valueClassName = '' }) {
  return (
    <div className="portal-stat-tile">
      <div className="portal-stat-top">
        <span className="portal-stat-icon" style={{ background: iconBg }}>{icon}</span>
        <div className="portal-stat-info">
          <span className="portal-stat-label">{label}</span>
          <span className={`portal-stat-value ${valueClassName}`}>{value}</span>
        </div>
      </div>
      <div className="portal-stat-bottom">
        {chart}
      </div>
    </div>
  );
}

/* ── Vertical bar chart for Invoice Overview ───────────────────────────── */
function InvoiceBarChart({ invoices }) {
  const months = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      result.push({ label, month: d.getMonth(), year: d.getFullYear(), total: 0, paid: 0 });
    }
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt || inv.issueDate);
      const bucket = result.find((m) => m.month === d.getMonth() && m.year === d.getFullYear());
      if (bucket) {
        bucket.total++;
        if (inv.status === 'PAID' || inv.amountDue === 0) bucket.paid++;
      }
    });
    return result;
  }, [invoices]);

  const maxVal = Math.max(...months.map((m) => m.total), 1);
  const barW = 20;
  const gap = 12;
  const chartH = 120;
  const labelH = 24;
  const svgW = months.length * (barW * 2 + gap * 2) + 20;

  return (
    <svg width="100%" height={chartH + labelH + 8} viewBox={`0 0 ${svgW} ${chartH + labelH + 8}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={0} y1={chartH * (1 - pct)}
          x2={svgW} y2={chartH * (1 - pct)}
          stroke="#e8e1d8" strokeWidth="0.5"
        />
      ))}
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <text
          key={`y-${pct}`}
          x={0} y={chartH * (1 - pct) - 3}
          fontSize="9" fill="#78716c"
        >
          {Math.round(maxVal * pct)}
        </text>
      ))}
      {months.map((m, i) => {
        const x = 20 + i * (barW * 2 + gap * 2);
        const hTotal = Math.max(2, (m.total / maxVal) * chartH);
        const hPaid = Math.max(0, (m.paid / maxVal) * chartH);
        return (
          <g key={m.label}>
            {/* Total bar */}
            <rect
              x={x} y={chartH - hTotal}
              width={barW} height={hTotal}
              rx={3} fill="#8b5a32" opacity="0.75"
            >
              <title>{m.label}: {m.total} total</title>
            </rect>
            {/* Paid bar */}
            <rect
              x={x + barW + 3} y={chartH - hPaid}
              width={barW} height={hPaid || 0}
              rx={3} fill="#16a34a" opacity="0.7"
            >
              <title>{m.label}: {m.paid} paid</title>
            </rect>
            {/* Month label */}
            <text
              x={x + barW} y={chartH + labelH - 6}
              textAnchor="middle"
              fontSize="11" fill="#78716c"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
