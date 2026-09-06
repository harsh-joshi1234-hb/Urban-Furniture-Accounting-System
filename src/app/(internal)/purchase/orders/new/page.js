'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { purchaseOrderService } from '@/services/purchase.service';
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

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const toast = useToast();

  const vendors = useApiResource(() => contactService.list({ type: 'VENDOR' }), []);
  const products = useApiResource(() => productService.list({ isActive: 'true' }), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const [form, setForm] = useState({ vendorId: '', orderDate: today() });
  const [lines, setLines] = useState([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => purchaseOrderService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Purchase order created');
        router.replace(`/purchase/orders/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = validateLines(lines);
    if (!form.vendorId) errors.vendorId = 'Vendor is required';
    if (!form.orderDate) errors.orderDate = 'Order date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      vendorId: form.vendorId,
      orderDate: form.orderDate,
      lines: toLinePayload(lines),
    });
  };

  const loading = vendors.loading || products.loading || analytics.loading;
  const loadError = vendors.error || products.error || analytics.error;

  if (loading) return <Loading label="Loading masters..." />;
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          vendors.reload();
          products.reload();
          analytics.reload();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="New purchase order"
        backHref="/purchase/orders"
        backLabel="Purchase orders"
      />

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
              label="PO Date"
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
            priceField="cost"
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/purchase/orders')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
