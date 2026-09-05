'use client';

import Loading from './Loading';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

export default function KanbanBoard({
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
  renderCard,
  getRowKey = (row, index) => row?.id ?? index,
}) {
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
      {rows.map((row, index) => (
        <div
          key={getRowKey(row, index)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`bg-white border border-slate-200 rounded-lg p-4 transition-all overflow-hidden flex flex-col ${
            onRowClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm hover:ring-1 hover:ring-indigo-200' : ''
          }`}
        >
          {renderCard(row)}
        </div>
      ))}
    </div>
  );
}
