'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { accountService } from '@/services/accounting.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TextField, SelectField, CheckboxField } from '@/components/ui/Field';
import { FormError } from '@/components/ui/ErrorState';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { ACCOUNT_TYPES } from '@/utils/constants';
import { titleCase } from '@/utils/format';

const EMPTY = { code: '', name: '', type: 'ASSET', parentId: '', isActive: true };

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const toast = useToast();
  const [filters, setFilters] = useState({ type: '', isActive: '' });
  const [search, setSearch] = useState('');

  const accounts = useApiResource(
    () =>
      accountService.list({
        type: filters.type || undefined,
        isActive: filters.isActive || undefined,
      }),
    [filters.type, filters.isActive],
  );

  const [editing, setEditing] = useState(null); // null | {} | account
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toggling, setToggling] = useState(null);

  const rows = useMemo(() => {
    const list = accounts.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((account) =>
      [account.code, account.name].some((value) =>
        String(value).toLowerCase().includes(term),
      ),
    );
  }, [accounts.data, search]);

  const openCreate = () => {
    setForm(EMPTY);
    setFieldErrors({});
    setEditing({});
  };

  const openEdit = (account) => {
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId || '',
      isActive: account.isActive,
    });
    setFieldErrors({});
    setEditing(account);
  };

  const save = useSubmit(
    () =>
      editing?.id
        ? accountService.update(editing.id, {
            code: form.code.trim(),
            name: form.name.trim(),
            type: form.type,
            parentId: form.parentId || null,
            isActive: form.isActive,
          })
        : accountService.create({
            code: form.code.trim(),
            name: form.name.trim(),
            type: form.type,
            ...(form.parentId ? { parentId: form.parentId } : {}),
          }),
    {
      onSuccess: () => {
        toast.success(editing?.id ? 'Account updated' : 'Account created');
        setEditing(null);
        accounts.reload();
      },
    },
  );

  const toggleActive = useSubmit(
    () => accountService.setActive(toggling.id, !toggling.isActive),
    {
      onSuccess: () => {
        toast.success(toggling.isActive ? 'Account deactivated' : 'Account activated');
        setToggling(null);
        accounts.reload();
      },
      onError: (err) => {
        setToggling(null);
        toast.error(err.message);
      },
    },
  );

  const onSave = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.code.trim()) errors.code = 'Code is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!ACCOUNT_TYPES.includes(form.type)) errors.type = 'Select an account type';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    save.submit();
  };

  const parentOptions = (accounts.data ?? [])
    .filter((account) => !editing?.id || account.id !== editing.id)
    .map((account) => ({ value: account.id, label: `${account.code} - ${account.name}` }));

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => <span className="font-medium text-stone-900">{row.code}</span>,
    },
    { key: 'name', header: 'Account Name' },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="slate">{titleCase(row.type)}</Badge>,
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (row.parent ? `${row.parent.code} - ${row.parent.name}` : '-'),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'danger' : 'success'}
            onClick={(event) => {
              event.stopPropagation();
              setToggling(row);
            }}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Chart of accounts"
        subtitle="Every account type drives how balances appear in the reports."
        actions={<Button onClick={openCreate}>New</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4">
          <TextField
            label="Search"
            name="search"
            placeholder="Code or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <SelectField
            label="Type"
            name="type"
            placeholder="All"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={ACCOUNT_TYPES.map((type) => ({ value: type, label: titleCase(type) }))}
            className="w-48"
          />
          <SelectField
            label="Status"
            name="isActive"
            placeholder="All"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            className="w-40"
          />
        </div>

        <Table
          columns={columns}
          rows={rows}
          loading={accounts.loading}
          error={accounts.error}
          onRetry={accounts.reload}
          onRowClick={(row) => router.push(`/account/chart-of-accounts/${row.id}`)}
          emptyTitle="No accounts found"
          emptyDescription="Create an account, or clear the filters."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              New account
            </Button>
          }
        />
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit account' : 'New account'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={save.submitting}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={save.submitting}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={onSave} className="space-y-4" noValidate>
          <FormError error={save.error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Account Code"
              name="code"
              required
              hint="Must be unique"
              value={form.code}
              error={fieldErrors.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <TextField
              label="Account Name"
              name="name"
              required
              value={form.name}
              error={fieldErrors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <SelectField
              label="Type"
              name="type"
              required
              placeholder={null}
              value={form.type}
              error={fieldErrors.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={ACCOUNT_TYPES.map((type) => ({ value: type, label: titleCase(type) }))}
            />
            <SelectField
              label="Parent account"
              name="parentId"
              placeholder="None"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              options={parentOptions}
            />
          </div>
          {editing?.id && (
            <CheckboxField
              label="Active"
              name="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? 'Deactivate this account?' : 'Activate this account?'}
        message={
          toggling?.isActive
            ? `${toggling?.code} - ${toggling?.name} will no longer be selectable on new documents or journal entries. Existing posted entries are unaffected.`
            : `${toggling?.code} - ${toggling?.name} will become selectable again.`
        }
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggling?.isActive ? 'danger' : 'success'}
        loading={toggleActive.submitting}
        onConfirm={() => toggleActive.submit()}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
