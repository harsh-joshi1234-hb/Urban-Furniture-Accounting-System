'use client';

import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import { productCategoryService } from '@/services/product.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TextField, CheckboxField } from '@/components/ui/Field';
import { FormError } from '@/components/ui/ErrorState';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/utils/format';

export default function ProductCategoriesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApiResource(
    () => productCategoryService.list(),
    [],
  );

  const [editing, setEditing] = useState(null); // null | {} | category
  const [form, setForm] = useState({ name: '', isActive: true });
  const [nameError, setNameError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const openCreate = () => {
    setForm({ name: '', isActive: true });
    setNameError(null);
    setEditing({});
  };

  const openEdit = (category) => {
    setForm({ name: category.name, isActive: category.isActive });
    setNameError(null);
    setEditing(category);
  };

  const save = useSubmit(
    () =>
      editing?.id
        ? productCategoryService.update(editing.id, {
            name: form.name.trim(),
            isActive: form.isActive,
          })
        : productCategoryService.create({ name: form.name.trim() }),
    {
      onSuccess: () => {
        toast.success(editing?.id ? 'Category updated' : 'Category created');
        setEditing(null);
        reload();
      },
    },
  );

  const remove = useSubmit(() => productCategoryService.remove(deleting.id), {
    onSuccess: () => {
      toast.success('Category deleted');
      setDeleting(null);
      reload();
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(err.message);
    },
  });

  const onSave = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setNameError('Category name is required');
      return;
    }
    setNameError(null);
    save.submit();
  };

  const columns = [
    {
      key: 'name',
      header: 'Category',
      render: (row) => <span className="font-medium text-stone-900">{row.name}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Product categories"
        subtitle="Categories are assigned to every product."
        backHref="/account/products"
        backLabel="Products"
        actions={<Button onClick={openCreate}>New</Button>}
      />

      <Card>
        <Table
          columns={columns}
          rows={data ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="No categories yet"
          emptyDescription="Create a category before adding products."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              New category
            </Button>
          }
        />
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit category' : 'New category'}
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
          <TextField
            label="Category name"
            name="categoryName"
            required
            value={form.name}
            error={nameError}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
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
        open={Boolean(deleting)}
        title="Delete category?"
        message={`"${deleting?.name}" will be removed. The backend blocks the delete when products still use it.`}
        confirmLabel="Delete"
        loading={remove.submitting}
        onConfirm={() => remove.submit()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
