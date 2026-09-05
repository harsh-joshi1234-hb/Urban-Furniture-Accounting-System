'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { vendorBillService } from '@/services/purchase.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PaymentDialog from '@/components/forms/PaymentDialog';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, sumAllocations, sumLineTotals } from '@/utils/format';

/**
 * Vendor payments. Like receipts, recorded payments are read back from the
 * allocations the backend returns on each bill.
 */
export default function VendorPaymentsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApiResource(() => vendorBillService.list(), []);
  const [paying, setPaying] = useState(null);

  const bills = useMemo(() => data ?? [], [data]);

  const outstanding = useMemo(
    () =>
      bills
        .filter((bill) => ['CONFIRMED', 'PARTIALLY_PAID'].includes(bill.status))
        .map((bill) => {
          const total = sumLineTotals(bill.lines);
          const paid = sumAllocations(bill.allocations);
          return { ...bill, total, paid, amountDue: Math.max(total - paid, 0) };
        })
        .filter((bill) => bill.amountDue > 0),
    [bills],
  );

  const payments = useMemo(
    () =>
      bills.flatMap((bill) =>
        (bill.allocations ?? []).map((allocation) => ({
          id: allocation.id,
          billId: bill.id,
          billNumber: bill.number,
          vendor: bill.vendor?.name,
          amount: allocation.allocatedAmount,
          createdAt: allocation.createdAt,
        })),
      ),
    [bills],
  );

  const outstandingColumns = [
    {
      key: 'number',
      header: 'Bill',
      render: (row) => (
        <Link
          href={`/purchase/bills/${row.id}`}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          {row.number}
        </Link>
      ),
    },
    { key: 'vendor', header: 'Vendor', render: (row) => row.vendor?.name || '-' },
    { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'total', header: 'Total', align: 'right', render: (row) => formatCurrency(row.total) },
    { key: 'paid', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paid) },
    {
      key: 'amountDue',
      header: 'Amount Due',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-amber-700">{formatCurrency(row.amountDue)}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button size="sm" onClick={() => setPaying(row)}>
          Pay
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    { key: 'createdAt', header: 'Recorded', render: (row) => formatDate(row.createdAt) },
    {
      key: 'billNumber',
      header: 'Bill',
      render: (row) => (
        <Link
          href={`/purchase/bills/${row.billId}`}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          {row.billNumber}
        </Link>
      ),
    },
    { key: 'vendor', header: 'Vendor' },
    {
      key: 'amount',
      header: 'Amount paid',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-emerald-600">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Send vendor payments against confirmed bills." />

      <Card title="Outstanding bills">
        <Table
          columns={outstandingColumns}
          rows={outstanding}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="Nothing outstanding"
          emptyDescription="Every confirmed bill is fully paid."
        />
      </Card>

      <Card title="Recorded payments" className="mt-5">
        <Table
          columns={paymentColumns}
          rows={payments}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="No payments yet"
          emptyDescription="Vendor payments you record will be listed here."
        />
      </Card>

      <PaymentDialog
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setPaying(null);
          toast.success('Payment recorded');
          reload();
        }}
        documentType="VENDOR_BILL"
        documentId={paying?.id}
        partner={paying?.vendor}
        amountDue={paying?.amountDue}
      />
    </div>
  );
}
