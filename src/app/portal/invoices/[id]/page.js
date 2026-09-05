'use client';

import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import portalService from '@/services/portal.service';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import DocumentLines from '@/components/DocumentLines';
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton';
import {
  formatCurrency,
  formatDate,
  sumAllocations,
  sumLineTotals,
} from '@/utils/format';

export default function PortalInvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Backend answers 404 for an invoice belonging to another customer (IDOR protection)
  const invoice = useApiResource(() => portalService.invoice(id), [id]);

  if (invoice.loading) return <Loading label="Loading invoice..." />;
  if (invoice.error) return <ErrorState error={invoice.error} onRetry={invoice.reload} />;
  if (!invoice.data) return <ErrorState error={{ status: 404, message: 'Invoice not found' }} />;

  const inv = invoice.data;
  const total = sumLineTotals(inv.lines);
  const paid = sumAllocations(inv.allocations);
  const amountDue = Math.max(total - paid, 0);
  const isPayable = inv.status === 'CONFIRMED' || inv.status === 'PARTIALLY_PAID';

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={inv.number}
        subtitle={`Invoice date ${formatDate(inv.invoiceDate)}`}
        backHref="/portal/invoices"
        backLabel="My invoices"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={formatCurrency(total)} />
        <StatCard label="Paid" value={formatCurrency(paid)} tone="green" />
        <StatCard
          label="Amount Due"
          value={formatCurrency(amountDue)}
          tone={amountDue > 0 ? 'red' : 'green'}
        />
      </div>

      <Card className="mt-4" title="Invoice" actions={<Badge status={inv.status} />} bodyClassName="p-4">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Reference</dt>
            <dd className="mt-0.5 text-slate-800">{inv.invoiceReference || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Invoice Date</dt>
            <dd className="mt-0.5 text-slate-800">{formatDate(inv.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Due Date</dt>
            <dd className="mt-0.5 text-slate-800">{formatDate(inv.dueDate)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Lines" className="mt-4">
        <DocumentLines lines={inv.lines ?? []} />
      </Card>

      <Card title="Payments" className="mt-4">
        {inv.allocations?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {inv.allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="text-sm text-slate-600">{formatDate(allocation.createdAt)}</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(allocation.allocatedAmount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No payments recorded against this invoice yet.
          </p>
        )}
      </Card>

      {/* Razorpay Online Payment Section */}
      {isPayable && (
        <Card title="Pay Online" className="mt-4" bodyClassName="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Pay securely online. Amount due:{' '}
            <span className="font-semibold text-slate-700">{formatCurrency(amountDue)}</span>
          </p>
          <RazorpayCheckoutButton
            invoice={inv}
            customer={{ name: user?.name, email: user?.email }}
            onPaymentComplete={invoice.reload}
          />
        </Card>
      )}

      {inv.status === 'PAID' && (
        <Card className="mt-4 border-emerald-200 bg-emerald-50">
          <div className="px-4 py-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-emerald-700">Invoice Fully Paid</p>
            <p className="text-sm text-slate-500 mt-1">Thank you for your payment</p>
          </div>
        </Card>
      )}
    </div>
  );
}
