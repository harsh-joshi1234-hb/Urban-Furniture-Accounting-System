import { formatCurrency, formatNumber, sumLineTotals } from '@/utils/format';

/**
 * Read-only line table for saved documents.
 * Every number rendered here is the value the backend stored.
 */
export default function DocumentLines({ lines = [], showAccount = false, products = [], analyticAccounts = [], accounts = [] }) {
  const nameOf = (collection, id, fallback = '-') =>
    collection.find((item) => item.id === id)?.name || fallback;

  const accountLabel = (id) => {
    const account = accounts.find((item) => item.id === id);
    return account ? `${account.code} - ${account.name}` : '-';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">Sr.</th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">Product</th>
            {showAccount && (
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                Chart of Account
              </th>
            )}
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">
              Budget Analytics
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-stone-500">Qty</th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-stone-500">
              Unit Price
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-stone-500">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {lines.map((line, index) => (
            <tr key={line.id ?? index}>
              <td className="px-4 py-2 text-stone-500">{index + 1}.</td>
              <td className="px-4 py-2 text-stone-800">
                {line.product?.name || nameOf(products, line.productId)}
              </td>
              {showAccount && (
                <td className="px-4 py-2 text-stone-600">{accountLabel(line.accountId)}</td>
              )}
              <td className="px-4 py-2 text-stone-600">
                {line.analyticAccountId
                  ? nameOf(analyticAccounts, line.analyticAccountId)
                  : '-'}
              </td>
              <td className="px-4 py-2 text-right text-stone-700">{formatNumber(line.quantity)}</td>
              <td className="px-4 py-2 text-right text-stone-700">
                {formatCurrency(line.unitPrice)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-stone-900">
                {formatCurrency(line.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-stone-50">
          <tr>
            <td colSpan={showAccount ? 6 : 5} className="px-4 py-3 text-right text-sm font-medium text-stone-700">
              Total
            </td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
              {formatCurrency(sumLineTotals(lines))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
