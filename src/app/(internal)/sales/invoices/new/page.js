'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { invoiceService } from '@/services/sales.service';
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

export default function NewInvoicePage() {
  const router = useRouter();
  const toast = useToast();

  const customers = useApiResource(() => contactService.list({ type: 'CUSTOMER' }), []);
  const products = useApiResource(() => productService.list({ isActive: 'true' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const accounts = useApiResource(() => accountService.list({ isActive: 'true' }), []);

  const [form, setForm] = useState({
    customerId: '',
    invoiceReference: '',
    invoiceDate: today(),
    dueDate: addDays(today(), 30),
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => invoiceService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Invoice created');
        router.replace(`/sales/invoices/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = validateLines(lines, { requireAccount: true });
    if (!form.customerId) errors.customerId = 'Customer is required';
    if (!form.invoiceDate) errors.invoiceDate = 'Invoice date is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      customerId: form.customerId,
      invoiceReference: form.invoiceReference || undefined,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      lines: toLinePayload(lines),
    });
  };

  const loading =
    customers.loading || products.loading || analytics.loading || accounts.loading;
  const loadError = customers.error || products.error || analytics.error || accounts.error;

  if (loading) return <Loading label="Loading masters..." />;
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          customers.reload();
          products.reload();
          analytics.reload();
          accounts.reload();
        }}
      />
    );
  }

  // Sales lines post to income accounts; the full chart stays available.
  const incomeAccounts = (accounts.data ?? []).filter(
    (account) => account.type === 'INCOME',
  );
  const accountOptions = incomeAccounts.length > 0 ? incomeAccounts : accounts.data ?? [];

  return (
    <div className="max-w-6xl">
      <PageHeader title="New customer invoice" backHref="/sales/invoices" backLabel="Invoices" />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError error={error} />
        {fieldErrors.lines && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {fieldErrors.lines}
          </div>
        )}

        <Card title="Invoice details" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label="Customer Name"
              name="customerId"
              required
              value={form.customerId}
              error={fieldErrors.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              options={(customers.data ?? []).map((contact) => ({
                value: contact.id,
                label: contact.name,
              }))}
            />
            <TextField
              label="Invoice Reference"
              name="invoiceReference"
              value={form.invoiceReference}
              placeholder="ABC-26-001"
              onChange={(e) => setForm({ ...form, invoiceReference: e.target.value })}
            />
            <TextField
              label="Invoice Date"
              name="invoiceDate"
              type="date"
              required
              value={form.invoiceDate}
              error={fieldErrors.invoiceDate}
              onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
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
            The invoice number is generated by the backend when the invoice is saved.
          </p>
        </Card>

        <Card title="Invoice lines">
          <LineItemsEditor
            lines={lines}
            onChange={setLines}
            products={products.data ?? []}
            analyticAccounts={analytics.data ?? []}
            accounts={accountOptions}
            showAccount
            errors={fieldErrors}
            priceField="salesPrice"
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/sales/invoices')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
