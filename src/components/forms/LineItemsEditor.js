'use client';

import Button from '@/components/ui/Button';
import { baseInput } from '@/components/ui/Field';
import { formatCurrency } from '@/utils/format';

export const emptyLine = () => ({
  productId: '',
  accountId: '',
  analyticAccountId: '',
  quantity: '1',
  unitPrice: '',
});

/**
 * Editable document lines for Sales Orders, Invoices, Purchase Orders and Bills.
 *
 * The row total shown here is a client-side preview only. Once the document is
 * saved every displayed total comes back from the backend.
 */
export default function LineItemsEditor({
  lines,
  onChange,
  products = [],
  analyticAccounts = [],
  accounts = [],
  showAccount = false,
  priceField = 'salesPrice',
  errors = {},
  disabled = false,
}) {
  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange(next);
  };

  const onProductChange = (index, productId) => {
    const product = products.find((item) => item.id === productId);
    const patch = { productId };
    // Prefill the price from the product master; the user can still override it.
    if (product && !lines[index].unitPrice) {
      patch.unitPrice = String(product[priceField] ?? '');
    }
    updateLine(index, patch);
  };

  const addLine = () => onChange([...lines, emptyLine()]);
  const removeLine = (index) => onChange(lines.filter((_, i) => i !== index));

  const previewTotal = (line) => Number(line.quantity || 0) * Number(line.unitPrice || 0);
  const grandPreview = lines.reduce((sum, line) => sum + previewTotal(line), 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                Sr.
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                Product
              </th>
              {showAccount && (
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                  Chart of Account
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                Budget Analytics
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-stone-500">
                Qty
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-stone-500">
                Unit Price
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-stone-500">
                Total
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {lines.map((line, index) => (
              <tr key={index} className="align-top">
                <td className="px-3 py-2 text-stone-500">{index + 1}.</td>
                <td className="px-3 py-2">
                  <select
                    className={baseInput}
                    value={line.productId}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} product`}
                    onChange={(e) => onProductChange(index, e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {errors[`lines.${index}.productId`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`lines.${index}.productId`]}
                    </p>
                  )}
                </td>
                {showAccount && (
                  <td className="px-3 py-2">
                    <select
                      className={baseInput}
                      value={line.accountId}
                      disabled={disabled}
                      aria-label={`Line ${index + 1} account`}
                      onChange={(e) => updateLine(index, { accountId: e.target.value })}
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                    {errors[`lines.${index}.accountId`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`lines.${index}.accountId`]}
                      </p>
                    )}
                  </td>
                )}
                <td className="px-3 py-2">
                  <select
                    className={baseInput}
                    value={line.analyticAccountId || ''}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} analytic account`}
                    onChange={(e) => updateLine(index, { analyticAccountId: e.target.value })}
                  >
                    <option value="">None</option>
                    {analyticAccounts.map((analytic) => (
                      <option key={analytic.id} value={analytic.id}>
                        {analytic.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={`${baseInput} w-24 text-right`}
                    value={line.quantity}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} quantity`}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                  {errors[`lines.${index}.quantity`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`lines.${index}.quantity`]}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${baseInput} w-28 text-right`}
                    value={line.unitPrice}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} unit price`}
                    onChange={(e) => updateLine(index, { unitPrice: e.target.value })}
                  />
                  {errors[`lines.${index}.unitPrice`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`lines.${index}.unitPrice`]}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-stone-700">
                  {formatCurrency(previewTotal(line))}
                </td>
                <td className="px-3 py-2 text-right">
                  {lines.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-3 py-3">
        <Button variant="secondary" size="sm" onClick={addLine} disabled={disabled}>
          Add line
        </Button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-stone-500">Preview total</p>
          <p className="text-base font-semibold text-stone-900">
            {formatCurrency(grandPreview)}
          </p>
          <p className="text-[11px] text-stone-400">
            Final totals are computed by the backend on save.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Shared client-side validation for document lines. */
export function validateLines(lines, { requireAccount = false } = {}) {
  const errors = {};
  if (!Array.isArray(lines) || lines.length === 0) {
    errors.lines = 'At least one line is required';
    return errors;
  }
  lines.forEach((line, index) => {
    if (!line.productId) errors[`lines.${index}.productId`] = 'Required';
    if (requireAccount && !line.accountId) errors[`lines.${index}.accountId`] = 'Required';
    if (line.quantity === '' || Number(line.quantity) <= 0) {
      errors[`lines.${index}.quantity`] = 'Must be > 0';
    }
    if (line.unitPrice !== '' && Number(line.unitPrice) < 0) {
      errors[`lines.${index}.unitPrice`] = 'Cannot be negative';
    }
  });
  return errors;
}

/** Maps editor rows onto the payload shape the backend validators expect. */
export function toLinePayload(lines) {
  return lines.map((line) => ({
    productId: line.productId,
    ...(line.accountId ? { accountId: line.accountId } : {}),
    analyticAccountId: line.analyticAccountId || null,
    quantity: Number(line.quantity),
    ...(line.unitPrice === '' ? {} : { unitPrice: Number(line.unitPrice) }),
  }));
}
