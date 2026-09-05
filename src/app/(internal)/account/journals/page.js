'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiResource } from '@/hooks/useApiResource';
import { journalService, accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { TextField, SelectField } from '@/components/ui/Field';
import { FormError } from '@/components/ui/ErrorState';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

// Fixed by the schema - SALES, PURCHASE, BANK, CASH. No other types exist.
const JOURNAL_TYPES = ['SALES', 'PURCHASE', 'BANK', 'CASH'];

export default function JournalsPage() {
  const toast = useToast();
  const journals = useApiResource(() => journalService.list(), []);
  const accounts = useApiResource(() => accountService.list({ isActive: 'true' }), []);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SALES', defaultAccountId: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const create = useSubmit(
    () =>
      journalService.create({
        name: form.name.trim(),
        type: form.type,
        defaultAccountId: form.defaultAccountId,
      }),
    {
      onSuccess: () => {
        toast.success('Journal created');
        setCreating(false);
        journals.reload();
      },
    },
  );

  const openCreate = () => {
    setForm({ name: '', type: 'SALES', defaultAccountId: '' });
    setFieldErrors({});
    setCreating(true);
  };

  const onSave = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Journal name is required';
    if (!JOURNAL_TYPES.includes(form.type)) errors.type = 'Select a journal type';
    if (!form.defaultAccountId) errors.defaultAccountId = 'Default account is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    create.submit();
  };

  const columns = [
    {
      key: 'name',
      header: 'Journal Name',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    { key: 'type', header: 'Type', render: (row) => <Badge tone="indigo">{row.type}</Badge> },
    {
      key: 'defaultAccount',
      header: 'Default Account',
      render: (row) =>
        row.defaultAccount ? (
          <Link
            href={`/account/chart-of-accounts/${row.defaultAccount.id}`}
            className="text-indigo-600 hover:text-indigo-700"
          >
            {row.defaultAccount.code} - {row.defaultAccount.name}
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'entries',
      header: '',
      align: 'right',
      render: (row) => (
        <Link
          href={`/account/journal-entries?journalId=${row.id}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View entries
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Journals"
        subtitle="Sales, Purchase, Bank and Cash journals. Confirmed documents post into these automatically."
        actions={<Button onClick={openCreate}>New</Button>}
      />

      <Card>
        <Table
          columns={columns}
          rows={journals.data ?? []}
          loading={journals.loading}
          error={journals.error}
          onRetry={journals.reload}
          emptyTitle="No journals"
          emptyDescription="Create the Sales, Purchase, Bank and Cash journals to start posting."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              New journal
            </Button>
          }
        />
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New journal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreating(false)}
              disabled={create.submitting}
            >
              Cancel
            </Button>
            <Button onClick={onSave} loading={create.submitting}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={onSave} className="space-y-4" noValidate>
          <FormError error={create.error} />
          <TextField
            label="Journal Name"
            name="name"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <SelectField
            label="Journal Type"
            name="type"
            required
            placeholder={null}
            value={form.type}
            error={fieldErrors.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={JOURNAL_TYPES.map((type) => ({ value: type, label: type }))}
          />
          <SelectField
            label="Default Account"
            name="defaultAccountId"
            required
            hint="Must be an active account from the chart of accounts"
            value={form.defaultAccountId}
            error={fieldErrors.defaultAccountId}
            onChange={(e) => setForm({ ...form, defaultAccountId: e.target.value })}
            options={(accounts.data ?? []).map((account) => ({
              value: account.id,
              label: `${account.code} - ${account.name}`,
            }))}
          />
        </form>
      </Modal>
    </div>
  );
}
