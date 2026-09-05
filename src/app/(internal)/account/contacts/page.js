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

export default function ContactsPage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

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
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
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
          <Link href="/account/contacts/new">
            <Button>New</Button>
          </Link>
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
      </Card>
    </div>
  );
}
