import { formatCurrency } from '@/utils/format';

/**
 * One labelled block of a financial report (Income, Expenses, Assets, ...).
 * Rows and the total are backend-supplied; nothing is summed here.
 */
export default function ReportSection({ title, rows = [], total, totalLabel = 'Total', tone }) {
  const toneClass =
    tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-red-700' : 'text-stone-900';

  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <h3 className="bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-600">
        {title}
      </h3>

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-stone-500">No amounts in this section.</p>
      ) : (
        <table className="min-w-full text-sm">
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, index) => (
              <tr key={row.code ?? index}>
                <td className="w-28 px-4 py-2 text-stone-500">{row.code || '-'}</td>
                <td className="px-4 py-2 text-stone-800">{row.name}</td>
                <td className="px-4 py-2 text-right text-stone-800">
                  {formatCurrency(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {total !== undefined && (
        <div className="flex items-center justify-between border-t border-stone-200 bg-white px-4 py-2.5">
          <span className="text-sm font-medium text-stone-700">{totalLabel}</span>
          <span className={`text-sm font-semibold ${toneClass}`}>{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}
