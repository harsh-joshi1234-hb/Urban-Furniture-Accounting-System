'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function PortalProfilePage() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const rows = [
    { label: 'Name', value: user?.name || '-' },
    { label: 'Login Id', value: user?.loginId },
    { label: 'Email', value: user?.email },
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" subtitle="Your account details." />

      <Card bodyClassName="p-4">
        <dl className="space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap justify-between gap-2">
              <dt className="text-sm text-slate-500">{row.label}</dt>
              <dd className="text-sm font-medium text-slate-900">{row.value}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm text-slate-500">Role</dt>
            <dd>
              <Badge tone="indigo">{user?.role}</Badge>
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>
              <Badge status={user?.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4">
        <Button
          variant="secondary"
          loading={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
