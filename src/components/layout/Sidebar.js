'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navForRole } from './navigation';

function isActive(pathname, href) {
  if (href === '/portal' || href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ role, open, onClose }) {
  const pathname = usePathname();
  const groups = navForRole(role);

  const content = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      <Link href={role === 'USER' ? '/portal' : '/dashboard'} className="px-2">
        <span className="block text-sm font-semibold text-white">Urban Furniture</span>
        <span className="block text-xs text-slate-400">Accounting System</span>
      </Link>

      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block rounded-md px-3 py-2 text-sm transition ${
                    isActive(pathname, item.href)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop / tablet */}
      <aside className="hidden w-60 shrink-0 bg-slate-900 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
          <aside className="relative h-full w-64 bg-slate-900">{content}</aside>
        </div>
      )}
    </>
  );
}
