'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { vendorBillService } from '@/services/purchase.service';
import contactService from '@/services/contact.api';
import productService from '@/services/product.api';
import analyticAccountService from '@/services/analytic.service';
import { accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import { SelectField, TextField } from '@/components/ui/Field';
import LineItemsEditor, {
  emptyLine,
  toLinePayload,
  validateLines,
} from '@/components/forms/LineItemsEditor';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { addDays, today } from '@/utils/format';

export default function NewVendorBillPage() {
  const router = useRouter();
  const toast = useToast();

  const vendors = useApiResource(() => contactService.list({ type: 'VENDOR' }), []);
  const products = useApiResource(() => productService.list({ isActive: 'true' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const accounts = useApiResource(() => accountService.list({ isActive: 'true' }), []);

  const [form, setForm] = useState({
    vendorId: '',
    billReference: '',
    billDate: today(),
    dueDate: addDays(today(), 30),
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => vendorBillService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Vendor bill created');
        router.replace(`/purchase/bills/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = validateLines(lines, { requireAccount: true });
    if (!form.vendorId) errors.vendorId = 'Vendor is required';
    if (!form.billDate) errors.billDate = 'Bill date is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      vendorId: form.vendorId,
      billReference: form.billReference || undefined,
      billDate: form.billDate,
      dueDate: form.dueDate,
      lines: toLinePayload(lines),
    });
  };

  const loading =
    vendors.loading || products.loading || analytics.loading || accounts.loading;
  const loadError = vendors.error || products.error || analytics.error || accounts.error;

  if (loading) return <Loading label="Loading masters..." />;
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          vendors.reload();
          products.reload();
          analytics.reload();
          accounts.reload();
        }}
      />
    );
  }

  // Bill lines post to expense accounts by default; the full chart stays available.
  const expenseAccounts = (accounts.data ?? []).filter((account) =>
    ['EXPENSE', 'OTHER_EXPENSE'].includes(account.type),
  );
  const accountOptions = expenseAccounts.length > 0 ? expenseAccounts : accounts.data ?? [];

  return (
    <div className="max-w-6xl">
      <PageHeader title="New vendor bill" backHref="/purchase/bills" backLabel="Vendor bills" />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError error={error} />
        {fieldErrors.lines && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {fieldErrors.lines}
          </div>
        )}

        <Card title="Bill details" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label="Vendor Name"
              name="vendorId"
              required
              value={form.vendorId}
              error={fieldErrors.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              options={(vendors.data ?? []).map((contact) => ({
                value: contact.id,
                label: contact.name,
              }))}
            />
            <TextField
              label="Bill Reference"
              name="billReference"
              value={form.billReference}
              placeholder="ABC-26-001"
              onChange={(e) => setForm({ ...form, billReference: e.target.value })}
            />
            <TextField
              label="Bill Date"
              name="billDate"
              type="date"
              required
              value={form.billDate}
              error={fieldErrors.billDate}
              onChange={(e) => setForm({ ...form, billDate: e.target.value })}
            />
            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              required
              value={form.dueDate}
              error={fieldErrors.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <p className="mt-3 text-xs text-stone-500">
            The bill number is generated by the backend when the bill is saved.
          </p>
        </Card>

        <Card title="Bill lines">
          <LineItemsEditor
            lines={lines}
            onChange={setLines}
            products={products.data ?? []}
            analyticAccounts={analytics.data ?? []}
            accounts={accountOptions}
            showAccount
            errors={fieldErrors}
            priceField="cost"
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/purchase/bills')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
