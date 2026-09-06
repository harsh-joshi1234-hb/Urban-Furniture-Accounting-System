'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RouteGuard from './RouteGuard';
import { useAuth } from '@/context/AuthContext';

function Shell({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      <Sidebar role={user?.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ allow, children }) {
  return (
    <RouteGuard allow={allow}>
      <Shell>{children}</Shell>
    </RouteGuard>
  );
}
