'use client';

import { useMemo, useState } from 'react';
import Loading from './Loading';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * List-view table used by every module.
 *
 * Owns its loading / empty / error states, alternates row shading so long
 * financial lists stay readable, pages at 10 rows so a screen never runs on
 * endlessly, and scrolls inside its own box both ways.
 *
 * columns: [{ key, header, render?(row), align?, className? }]
 */
export default function Table({
  columns,
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getRowKey = (row, index) => row?.id ?? index,
  footer,
  pageSize = 10,
  maxBodyHeight = '30rem',
}) {
  const [page, setPage] = useState(1);
  const total = rows?.length ?? 0;
  const paged = pageSize > 0 && total > pageSize;
  const pageCount = paged ? Math.ceil(total / pageSize) : 1;

  // A filter change can shrink the list past the current page, so the page is
  // clamped while rendering rather than corrected afterwards in an effect.
  const safePage = Math.min(page, Math.max(pageCount, 1));

  // Every row stays in the DOM and the page window only controls visibility, so
  // Print / Save as PDF captures the whole list rather than the current page.
  const pageWindow = useMemo(() => {
    if (!paged) return { start: 0, end: rows?.length ?? 0 };
    const start = (safePage - 1) * pageSize;
    return { start, end: start + pageSize };
  }, [paged, safePage, pageSize, rows]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (total === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  const firstOnPage = paged ? (safePage - 1) * pageSize + 1 : 1;
  const lastOnPage = paged ? Math.min(safePage * pageSize, total) : total;

  return (
    <div>
      <div className="table-scroll overflow-y-auto print:!max-h-none print:!overflow-visible" style={{ maxHeight: maxBodyHeight }}>
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-stone-100/95 backdrop-blur">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap border-b border-stone-300 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-600 ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const onPage = index >= pageWindow.start && index < pageWindow.end;
              return (
              <tr
                key={getRowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // Alternating bands keep the eye on one record across wide tables.
                className={`border-b border-stone-100 transition-colors duration-150 ${
                  onPage ? '' : 'hidden print:table-row'
                } ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50'} ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-brand-50 hover:shadow-[inset_3px_0_0_0_var(--brand)]'
                    : 'hover:bg-brand-50/60'
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle text-stone-700 ${
                      column.align === 'right' ? 'text-right tabular' : ''
                    } ${column.className || ''}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
              );
            })}
          </tbody>
          {footer && (
            <tfoot className="border-t border-stone-200 bg-stone-100 font-medium text-stone-900">
              {footer}
            </tfoot>
          )}
        </table>
      </div>

      {paged && (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-2.5 print:hidden"
          aria-label="Pagination"
        >
          <p className="text-xs text-stone-500">
            Showing <span className="font-medium text-stone-700 tabular">{firstOnPage}</span>–
            <span className="font-medium text-stone-700 tabular">{lastOnPage}</span> of{' '}
            <span className="font-medium text-stone-700 tabular">{total}</span>
          </p>

          <div className="flex items-center gap-1">
            <PageButton onClick={() => setPage(1)} disabled={safePage === 1} label="First page">
              «
            </PageButton>
            <PageButton
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              label="Previous page"
            >
              ‹
            </PageButton>
            <span className="px-2 text-xs font-medium text-stone-600 tabular">
              Page {safePage} of {pageCount}
            </span>
            <PageButton
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage === pageCount}
              label="Next page"
            >
              ›
            </PageButton>
            <PageButton
              onClick={() => setPage(pageCount)}
              disabled={safePage === pageCount}
              label="Last page"
            >
              »
            </PageButton>
          </div>
        </nav>
      )}
    </div>
  );
}

function PageButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 min-w-7 items-center justify-center rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white focus-ring"
    >
      {children}
    </button>
  );
}
