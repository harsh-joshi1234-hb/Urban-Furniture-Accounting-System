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
          {row.imageUrl ? (
            <div
              className="h-8 w-8 shrink-0 rounded bg-cover bg-center ring-1 ring-slate-200"
              style={{ backgroundImage: `url(${row.imageUrl})` }}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 ring-1 ring-slate-200 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}
          <span className="font-medium text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'CUSTOMER' ? 'indigo' : 'amber'}>
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
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
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
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400 overflow-hidden">
                  {row.imageUrl ? (
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${row.imageUrl})` }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="truncate font-semibold text-slate-900">{row.name}</h3>
                  </div>
                  <p className="truncate text-sm text-slate-500">{row.email || '-'}</p>
                  <p className="truncate text-sm text-slate-500">{row.phone || '-'}</p>
                  <div className="mt-2 flex">
                    <Badge tone={row.type === 'CUSTOMER' ? 'indigo' : 'amber'}>
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
