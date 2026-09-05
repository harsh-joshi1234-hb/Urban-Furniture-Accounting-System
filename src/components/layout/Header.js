'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Toggle navigation"
      >
        <span className="block h-0.5 w-5 bg-current" />
        <span className="mt-1 block h-0.5 w-5 bg-current" />
        <span className="mt-1 block h-0.5 w-5 bg-current" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.name || user?.loginId}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        {user?.role && <Badge tone="indigo">{user.role}</Badge>}
        <Button variant="secondary" size="sm" onClick={handleLogout} loading={loggingOut}>
          Logout
        </Button>
      </div>
    </header>
  );
}
