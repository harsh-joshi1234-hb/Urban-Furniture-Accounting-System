'use client';

import { useState, useEffect } from 'react';
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

  // Track collapsed state per group label (default: all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Auto-expand group if it contains the active page
  useEffect(() => {
    groups.forEach((group) => {
      const hasActive = group.items.some((item) => isActive(pathname, item.href));
      if (hasActive) {
        setCollapsedGroups((prev) => {
          if (!prev[group.label]) return prev;
          return { ...prev, [group.label]: false };
        });
      }
    });
  }, [pathname, groups]);

  const toggleGroup = (label) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const content = (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4">
      <Link href={role === 'USER' ? '/portal' : '/dashboard'} className="px-2">
        <span className="block text-sm font-semibold text-white">Urban Furniture</span>
        <span className="block text-xs text-slate-400">Accounting System</span>
      </Link>

      {groups.map((group) => {
        const isCollapsed = !!collapsedGroups[group.label];
        const isOpen = !isCollapsed;

        return (
          <div key={group.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="group flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-200 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span>{group.label}</span>
              <svg
                className={`h-3.5 w-3.5 transform text-slate-400 transition-transform duration-200 group-hover:text-slate-200 ${
                  isOpen ? 'rotate-0' : '-rotate-90'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`block rounded-md px-3 py-2 text-sm transition ${
                        isActive(pathname, item.href)
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
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
