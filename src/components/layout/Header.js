'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

/** "System Admin" -> "SA" */
function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-lg text-stone-600 transition hover:bg-stone-100 focus-ring lg:hidden"
        aria-label="Toggle navigation"
      >
        <span className="block h-0.5 w-4.5 rounded bg-current" />
        <span className="block h-0.5 w-4.5 rounded bg-current" />
        <span className="block h-0.5 w-4.5 rounded bg-current" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {user?.role && <Badge tone="brand">{user.role}</Badge>}

        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold text-white"
            aria-hidden="true"
          >
            {initials(user?.name || user?.loginId)}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-stone-900">
              {user?.name || user?.loginId}
            </p>
            <p className="text-xs text-stone-500">{user?.email}</p>
          </div>
        </div>

        <span className="hidden h-6 w-px bg-stone-200 sm:block" aria-hidden="true" />

        <Button variant="secondary" size="sm" onClick={handleLogout} loading={loggingOut}>
          Logout
        </Button>
      </div>
    </header>
  );
}
