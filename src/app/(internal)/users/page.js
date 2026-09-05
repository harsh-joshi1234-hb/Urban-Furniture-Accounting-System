'use client';

import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import userService from '@/services/user.service';
import RouteGuard from '@/components/layout/RouteGuard';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TextField, SelectField } from '@/components/ui/Field';
import { FormError } from '@/components/ui/ErrorState';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/utils/format';
import { ROLES } from '@/utils/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UsersScreen() {
  const toast = useToast();
  const users = useApiResource(() => userService.list(), []);
  const roles = useApiResource(() => userService.roles(), []);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const openCreate = () => {
    setForm({ name: '', loginId: '', email: '', password: '', roleId: '' });
    setFieldErrors({});
    setCreating(true);
  };

  const openEdit = (user) => {
    const roleId =
      (roles.data ?? []).find((role) => role.name === user.role?.name)?.id || '';
    setForm({
      name: user.name || '',
      loginId: user.loginId,
      email: user.email,
      password: '',
      roleId,
    });
    setFieldErrors({});
    setEditing(user);
  };

  const create = useSubmit(
    () =>
      userService.create({
        name: form.name || form.loginId,
        loginId: form.loginId,
        email: form.email,
        password: form.password,
        roleId: form.roleId,
      }),
    {
      onSuccess: () => {
        toast.success('User created');
        setCreating(false);
        users.reload();
      },
    },
  );

  const update = useSubmit(
    () =>
      userService.update(editing.id, {
        name: form.name,
        email: form.email,
        roleId: form.roleId,
      }),
    {
      onSuccess: () => {
        toast.success('User updated');
        setEditing(null);
        users.reload();
      },
    },
  );

  const toggleActive = useSubmit(
    () =>
      toggling.isActive
        ? userService.deactivate(toggling.id)
        : userService.activate(toggling.id),
    {
      onSuccess: () => {
        toast.success(toggling.isActive ? 'User deactivated' : 'User activated');
        setToggling(null);
        users.reload();
      },
      onError: (err) => {
        setToggling(null);
        toast.error(err.message);
      },
    },
  );

  const deleteUser = useSubmit(
    () => userService.delete(deleting.id),
    {
      onSuccess: () => {
        toast.success('User deleted');
        setDeleting(null);
        users.reload();
      },
      onError: (err) => {
        setDeleting(null);
        toast.error(err.message);
      },
    }
  );

  const validate = ({ requirePassword }) => {
    const errors = {};
    if (requirePassword) {
      if (!form.loginId || form.loginId.length < 6 || form.loginId.length > 12) {
        errors.loginId = 'Login Id must be 6-12 characters';
      }
      if (!form.password || form.password.length <= 8) {
        errors.password = 'Password must be more than 8 characters';
      }
    }
    if (!EMAIL_RE.test(form.email || '')) errors.email = 'Enter a valid email';
    if (!form.roleId) errors.roleId = 'Role is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitCreate = (event) => {
    event.preventDefault();
    if (validate({ requirePassword: true })) create.submit();
  };

  const submitUpdate = (event) => {
    event.preventDefault();
    if (validate({ requirePassword: false })) update.submit();
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium text-stone-900">{row.name}</span>,
    },
    { key: 'loginId', header: 'Login Id' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge tone="brand">{row.role?.name}</Badge>,
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
          <Button
            size="sm"
            variant={row.isActive ? 'danger' : 'success'}
            onClick={() => setToggling(row)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {!row.isActive && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleting(row)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const roleOptions = (roles.data ?? []).map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Admin-only. Create staff accounts and manage access."
        actions={<Button onClick={openCreate}>New</Button>}
      />

      <Card>
        <Table
          columns={columns}
          rows={users.data ?? []}
          loading={users.loading}
          error={users.error}
          onRetry={users.reload}
          emptyTitle="No users"
          emptyDescription="Create the first internal user."
        />
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)} disabled={create.submitting}>
              Cancel
            </Button>
            <Button onClick={submitCreate} loading={create.submitting}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={submitCreate} className="space-y-4" noValidate>
          <FormError error={create.error} />
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Login Id"
            name="loginId"
            required
            hint="6-12 characters, unique"
            value={form.loginId}
            error={fieldErrors.loginId}
            onChange={(e) => setForm({ ...form, loginId: e.target.value })}
          />
          <TextField
            label="Email Id"
            name="email"
            type="email"
            required
            value={form.email}
            error={fieldErrors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            hint="More than 8 characters"
            value={form.password}
            error={fieldErrors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <SelectField
            label="Role"
            name="roleId"
            required
            value={form.roleId}
            error={fieldErrors.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            options={roleOptions}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.loginId || 'user'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={update.submitting}>
              Cancel
            </Button>
            <Button onClick={submitUpdate} loading={update.submitting}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={submitUpdate} className="space-y-4" noValidate>
          <FormError error={update.error} />
          <TextField
            label="Name"
            name="editName"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Email Id"
            name="editEmail"
            type="email"
            required
            value={form.email}
            error={fieldErrors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <SelectField
            label="Role"
            name="editRoleId"
            required
            value={form.roleId}
            error={fieldErrors.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            options={roleOptions}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? 'Deactivate this user?' : 'Activate this user?'}
        message={
          toggling?.isActive
            ? `${toggling?.loginId} will no longer be able to sign in.`
            : `${toggling?.loginId} will be able to sign in again.`
        }
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggling?.isActive ? 'danger' : 'success'}
        loading={toggleActive.submitting}
        onConfirm={() => toggleActive.submit()}
        onCancel={() => setToggling(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this user?"
        message={`Are you sure you want to permanently delete ${deleting?.loginId}? This action cannot be undone.`}
        confirmLabel="Delete permanently"
        variant="danger"
        loading={deleteUser.submitting}
        onConfirm={() => deleteUser.submit()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default function UsersPage() {
  // Admin-only route: guarded here as well as in the sidebar.
  return (
    <RouteGuard allow={[ROLES.ADMIN]}>
      <UsersScreen />
    </RouteGuard>
  );
}
