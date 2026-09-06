'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { salesOrderService } from '@/services/sales.service';
import contactService from '@/services/contact.api';
import productService from '@/services/product.api';
import analyticAccountService from '@/services/analytic.service';
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
import { today } from '@/utils/format';

export default function NewSalesOrderPage() {
  const router = useRouter();
  const toast = useToast();

  const customers = useApiResource(() => contactService.list({ type: 'CUSTOMER' }), []);
  const products = useApiResource(() => productService.list({ isActive: 'true' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const [form, setForm] = useState({ customerId: '', orderDate: today() });
  const [lines, setLines] = useState([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => salesOrderService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Sales order created');
        router.replace(`/sales/orders/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = validateLines(lines);
    if (!form.customerId) errors.customerId = 'Customer is required';
    if (!form.orderDate) errors.orderDate = 'Order date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      customerId: form.customerId,
      orderDate: form.orderDate,
      lines: toLinePayload(lines),
    });
  };

  const loading = customers.loading || products.loading || analytics.loading;
  const loadError = customers.error || products.error || analytics.error;

  if (loading) return <Loading label="Loading masters..." />;
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          customers.reload();
          products.reload();
          analytics.reload();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="New sales order" backHref="/sales/orders" backLabel="Sales orders" />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError error={error} />
        {fieldErrors.lines && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {fieldErrors.lines}
          </div>
        )}

        <Card title="Order details" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              label="SO Date"
              name="orderDate"
              type="date"
              required
              value={form.orderDate}
              error={fieldErrors.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
            />
          </div>
        </Card>

        <Card title="Order lines">
          <LineItemsEditor
            lines={lines}
            onChange={setLines}
            products={products.data ?? []}
            analyticAccounts={analytics.data ?? []}
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
            onClick={() => router.push('/sales/orders')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
