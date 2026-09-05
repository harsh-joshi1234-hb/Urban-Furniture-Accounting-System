'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import budgetService from '@/services/budget.api';
import analyticAccountService from '@/services/analytic.service';
import contactService from '@/services/contact.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import { SelectField, TextField } from '@/components/ui/Field';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { ANALYTIC_TYPES } from '@/utils/constants';

export default function NewBudgetPage() {
  const router = useRouter();
  const toast = useToast();

  const analytics = useApiResource(() => analyticAccountService.list(), []);
  const contacts = useApiResource(() => contactService.list(), []);

  const [form, setForm] = useState({
    name: '',
    analyticAccountId: '',
    type: 'EXPENSE',
    startDate: '',
    endDate: '',
    committedAmount: '',
    responsibleContactId: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => budgetService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Budget created as draft');
        router.replace(`/account/budgets/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Budget name is required';
    if (!form.analyticAccountId) errors.analyticAccountId = 'Analytic account is required';
    if (!ANALYTIC_TYPES.includes(form.type)) errors.type = 'Select a type';
    if (!form.startDate) errors.startDate = 'Start date is required';
    if (!form.endDate) errors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errors.endDate = 'End date cannot be before start date';
    }
    if (
      form.committedAmount === '' ||
      Number.isNaN(Number(form.committedAmount)) ||
      Number(form.committedAmount) < 0
    ) {
      errors.committedAmount = 'Committed amount must be a non-negative number';
    }
    if (!form.responsibleContactId) {
      errors.responsibleContactId = 'Responsible contact is required';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      name: form.name.trim(),
      analyticAccountId: form.analyticAccountId,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      committedAmount: Number(form.committedAmount),
      responsibleContactId: form.responsibleContactId,
    });
  };

  if (analytics.loading || contacts.loading) return <Loading label="Loading masters..." />;
  if (analytics.error || contacts.error) {
    return (
      <ErrorState
        error={analytics.error || contacts.error}
        onRetry={() => {
          analytics.reload();
          contacts.reload();
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New budget"
        subtitle="Saved as a draft. Confirm it to start tracking achievement."
        backHref="/account/budgets"
        backLabel="Budgets"
      />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError error={error} />

        <Card title="Budget details" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Budget Name"
              name="name"
              required
              className="sm:col-span-2"
              value={form.name}
              error={fieldErrors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <SelectField
              label="Analyticals"
              name="analyticAccountId"
              required
              hint="Must be an active analytic account"
              value={form.analyticAccountId}
              error={fieldErrors.analyticAccountId}
              onChange={(e) => {
                const selected = (analytics.data ?? []).find(
                  (item) => item.id === e.target.value,
                );
                setForm({
                  ...form,
                  analyticAccountId: e.target.value,
                  // The analytic account carries its own type; keep them aligned.
                  type: selected?.type || form.type,
                });
              }}
              options={(analytics.data ?? [])
                .filter((item) => item.isActive)
                .map((item) => ({ value: item.id, label: `${item.name} (${item.type})` }))}
            />
            <SelectField
              label="Type"
              name="type"
              required
              placeholder={null}
              hint="Income tracks invoice lines, Expense tracks vendor bill lines"
              value={form.type}
              error={fieldErrors.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={ANALYTIC_TYPES.map((type) => ({ value: type, label: type }))}
            />
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              required
              value={form.startDate}
              error={fieldErrors.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              required
              value={form.endDate}
              error={fieldErrors.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <TextField
              label="Committed Amount"
              name="committedAmount"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.committedAmount}
              error={fieldErrors.committedAmount}
              onChange={(e) => setForm({ ...form, committedAmount: e.target.value })}
            />
            <SelectField
              label="Responsible"
              name="responsibleContactId"
              required
              value={form.responsibleContactId}
              error={fieldErrors.responsibleContactId}
              onChange={(e) => setForm({ ...form, responsibleContactId: e.target.value })}
              options={(contacts.data ?? []).map((contact) => ({
                value: contact.id,
                label: contact.name,
              }))}
            />
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/account/budgets')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
