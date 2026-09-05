'use client';

import Button from '@/components/ui/Button';
import { baseInput } from '@/components/ui/Field';
import { formatCurrency } from '@/utils/format';
import { balanceOf } from '@/utils/money';

export const emptyItem = () => ({
  accountId: '',
  partnerId: '',
  analyticAccountId: '',
  debit: '',
  credit: '',
  description: '',
});

/**
 * Debit/credit line editor for journal entries.
 *
 * The running debit/credit totals shown here are a convenience check computed in
 * integer paise. The backend re-validates and refuses to create or post an
 * unbalanced entry, so it stays the authority on whether an entry is valid.
 */
export default function JournalItemsEditor({
  items,
  onChange,
  accounts = [],
  partners = [],
  analyticAccounts = [],
  errors = {},
  disabled = false,
}) {
  const updateItem = (index, patch) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  // A line carries either a debit or a credit, never both.
  const onAmountChange = (index, field, value) => {
    const other = field === 'debit' ? 'credit' : 'debit';
    updateItem(index, { [field]: value, ...(value ? { [other]: '' } : {}) });
  };

  const addItem = () => onChange([...items, emptyItem()]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const { totalDebit, totalCredit, isBalanced, difference } = balanceOf(items);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Account
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Partner
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Analytic
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Description
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
                Debit
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
                Credit
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="align-top">
                <td className="px-3 py-2">
                  <select
                    className={`${baseInput} min-w-[180px]`}
                    value={item.accountId}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} account`}
                    onChange={(e) => updateItem(index, { accountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  {errors[`items.${index}.accountId`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`items.${index}.accountId`]}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    className={`${baseInput} min-w-[140px]`}
                    value={item.partnerId || ''}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} partner`}
                    onChange={(e) => updateItem(index, { partnerId: e.target.value })}
                  >
                    <option value="">None</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className={`${baseInput} min-w-[140px]`}
                    value={item.analyticAccountId || ''}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} analytic account`}
                    onChange={(e) => updateItem(index, { analyticAccountId: e.target.value })}
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
                    type="text"
                    className={`${baseInput} min-w-[160px]`}
                    value={item.description || ''}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} description`}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${baseInput} w-28 text-right`}
                    value={item.debit}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} debit`}
                    onChange={(e) => onAmountChange(index, 'debit', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${baseInput} w-28 text-right`}
                    value={item.credit}
                    disabled={disabled}
                    aria-label={`Line ${index + 1} credit`}
                    onChange={(e) => onAmountChange(index, 'credit', e.target.value)}
                  />
                  {errors[`items.${index}.amount`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`items.${index}.amount`]}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {items.length > 2 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3 py-3">
        <Button variant="secondary" size="sm" onClick={addItem} disabled={disabled}>
          Add line
        </Button>

        <div className="flex flex-wrap items-center gap-5 text-right">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Debit</p>
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(totalDebit)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Credit</p>
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(totalCredit)}</p>
          </div>
          <div
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              isBalanced
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
            role="status"
          >
            {isBalanced
              ? 'Balanced'
              : `Out of balance by ${formatCurrency(Math.abs(difference))}`}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Client-side pre-check mirroring the backend rules: at least two lines, a valid
 * account per line, exactly one of debit/credit per line, and debit = credit.
 */
export function validateItems(items) {
  const errors = {};
  if (!Array.isArray(items) || items.length < 2) {
    errors.items = 'A journal entry needs at least 2 lines';
    return errors;
  }

  let hasDebit = false;
  let hasCredit = false;

  items.forEach((item, index) => {
    if (!item.accountId) errors[`items.${index}.accountId`] = 'Required';

    const debit = Number(item.debit || 0);
    const credit = Number(item.credit || 0);

    if (debit < 0 || credit < 0) {
      errors[`items.${index}.amount`] = 'Cannot be negative';
    } else if (debit > 0 && credit > 0) {
      errors[`items.${index}.amount`] = 'Use either debit or credit';
    } else if (debit === 0 && credit === 0) {
      errors[`items.${index}.amount`] = 'Enter a debit or a credit';
    }

    if (debit > 0) hasDebit = true;
    if (credit > 0) hasCredit = true;
  });

  if (!hasDebit || !hasCredit) {
    errors.items = 'The entry needs at least one debit and one credit line';
  } else if (!balanceOf(items).isBalanced) {
    errors.items = 'Total debit must equal total credit';
  }

  return errors;
}

/** Maps editor rows onto the payload shape the backend validator expects. */
export function toItemsPayload(items) {
  return items.map((item) => ({
    accountId: item.accountId,
    partnerId: item.partnerId || null,
    analyticAccountId: item.analyticAccountId || null,
    debit: Number(item.debit || 0),
    credit: Number(item.credit || 0),
    description: item.description || '',
  }));
}

/** Maps a saved entry's items back into editor rows. */
export function toEditorItems(items = []) {
  return items.map((item) => ({
    accountId: item.accountId || '',
    partnerId: item.partnerId || '',
    analyticAccountId: item.analyticAccountId || '',
    debit: Number(item.debit) ? String(Number(item.debit)) : '',
    credit: Number(item.credit) ? String(Number(item.credit)) : '',
    description: item.description || '',
  }));
}
