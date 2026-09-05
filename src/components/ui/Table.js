'use client';

import Loading from './Loading';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * List-view table used by every module. It owns its loading / empty / error
 * states so no page ever renders a bare table.
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
}) {
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                  column.align === 'right' ? 'text-right' : ''
                } ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={
                onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : 'hover:bg-slate-50'
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-slate-700 ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.className || ''}`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="bg-slate-50 font-medium text-slate-800">{footer}</tfoot>}
      </table>
    </div>
  );
}
