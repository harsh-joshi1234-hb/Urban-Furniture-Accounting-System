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
      <Link
        href={role === 'USER' ? '/portal' : '/dashboard'}
        className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white shadow-sm">
          UF
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-white">
            Urban Furniture
          </span>
          <span className="block truncate text-[11px] text-stone-400">Accounting System</span>
        </span>
      </Link>

      {groups.map((group) => {
        const isCollapsed = !!collapsedGroups[group.label];
        const isOpen = !isCollapsed;

        return (
          <div key={group.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="group flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-300 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span>{group.label}</span>
              <svg
                className={`h-3.5 w-3.5 transform text-stone-400 transition-transform duration-200 group-hover:text-stone-200 ${
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
                      className={`relative block rounded-lg py-2 pl-3.5 pr-3 text-sm transition ${
                        isActive(pathname, item.href)
                          ? 'bg-brand-600 font-medium text-white shadow-sm before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-white/80'
                          : 'text-stone-400 hover:bg-white/5 hover:text-white'
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
      <aside className="hidden w-60 shrink-0 border-r border-stone-800 bg-[#1c1917] lg:block print:hidden">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} aria-hidden="true" />
          <aside className="relative h-full w-64 border-r border-stone-800 bg-[#1c1917]">{content}</aside>
        </div>
      )}
    </>
  );
}
