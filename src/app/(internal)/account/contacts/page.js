'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import contactService from '@/services/contact.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { TextField, SelectField } from '@/components/ui/Field';
import ViewToggle from '@/components/ui/ViewToggle';
import KanbanBoard from '@/components/ui/KanbanBoard';

export default function ContactsPage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const { data, loading, error, reload } = useApiResource(
    () => contactService.list(type ? { type } : undefined),
    [type],
  );

  const rows = useMemo(() => {
    const contacts = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [data, search]);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.imageUrl} name={row.name} size="sm" />
          <span className="font-medium text-stone-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'CUSTOMER' ? 'brand' : 'amber'}>
          {row.type === 'CUSTOMER' ? 'Customer' : 'Vendor'}
        </Badge>
      ),
    },
    { key: 'email', header: 'Email', render: (row) => row.email || '-' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
    {
      key: 'city',
      header: 'City',
      render: (row) => [row.city, row.state].filter(Boolean).join(', ') || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Customers and vendors used across sales and purchase."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            <Link href="/account/contacts/new">
              <Button>New</Button>
            </Link>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4">
          <TextField
            label="Search"
            name="search"
            placeholder="Name, email, phone or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px] flex-1"
          />
          <SelectField
            label="Type"
            name="type"
            value={type}
            placeholder="All"
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'VENDOR', label: 'Vendor' },
            ]}
            className="w-40"
          />
        </div>

        {viewMode === 'list' ? (
          <Table
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            onRetry={reload}
            onRowClick={(row) => router.push(`/account/contacts/${row.id}`)}
            emptyTitle="No contacts found"
            emptyDescription={
              search || type
                ? 'No contact matches the current filters.'
                : 'Create your first customer or vendor.'
            }
            emptyAction={
              <Link href="/account/contacts/new">
                <Button size="sm">New contact</Button>
              </Link>
            }
          />
        ) : (
          <KanbanBoard
            rows={rows}
            loading={loading}
            error={error}
            onRetry={reload}
            onRowClick={(row) => router.push(`/account/contacts/${row.id}`)}
            emptyTitle="No contacts found"
            emptyDescription={
              search || type
                ? 'No contact matches the current filters.'
                : 'Create your first customer or vendor.'
            }
            emptyAction={
              <Link href="/account/contacts/new">
                <Button size="sm">New contact</Button>
              </Link>
            }
            renderCard={(row) => (
              <div className="flex items-start gap-4">
                <Avatar src={row.imageUrl} name={row.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="truncate font-semibold text-stone-900">{row.name}</h3>
                  </div>
                  <p className="truncate text-sm text-stone-500">{row.email || '-'}</p>
                  <p className="truncate text-sm text-stone-500">{row.phone || '-'}</p>
                  <div className="mt-2 flex">
                    <Badge tone={row.type === 'CUSTOMER' ? 'brand' : 'amber'}>
                      {row.type === 'CUSTOMER' ? 'Customer' : 'Vendor'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
}
