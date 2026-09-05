'use client';

import { useState } from 'react';
import { TextField, SelectField, CheckboxField } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormError } from '@/components/ui/ErrorState';
import { ANALYTIC_TYPES } from '@/utils/constants';
import { toDateInput } from '@/utils/format';

const EMPTY = { name: '', type: 'EXPENSE', startDate: '', endDate: '', isActive: true };

export default function AnalyticAccountForm({
  initial,
  onSubmit,
  submitting,
  error,
  onCancel,
  isEdit = false,
}) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...(initial
      ? {
          ...initial,
          startDate: toDateInput(initial.startDate),
          endDate: toDateInput(initial.endDate),
        }
      : {}),
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Account name is required';
    if (!ANALYTIC_TYPES.includes(form.type)) errors.type = 'Type must be Income or Expense';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errors.endDate = 'End date cannot be before start date';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      type: form.type,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      ...(isEdit ? { isActive: form.isActive } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError error={error} />

      <Card title="Analytic account" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Analytic Account"
            name="name"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={update('name')}
          />
          <SelectField
            label="Type"
            name="type"
            required
            placeholder={null}
            value={form.type}
            error={fieldErrors.type}
            onChange={update('type')}
            options={ANALYTIC_TYPES.map((type) => ({ value: type, label: type }))}
            hint="Income maps to invoice lines, Expense to purchase and bill lines"
          />
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={form.startDate || ''}
            onChange={update('startDate')}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={form.endDate || ''}
            error={fieldErrors.endDate}
            onChange={update('endDate')}
          />
          {isEdit && (
            <CheckboxField
              label="Active"
              name="isActive"
              className="sm:col-span-2"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting}>
          Save
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
