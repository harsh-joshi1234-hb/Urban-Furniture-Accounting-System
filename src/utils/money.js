/**
 * Money helpers for the accounting screens.
 *
 * Amounts arrive from the backend as Prisma Decimals serialised to strings.
 * Anywhere the UI has to add them up for display (a running ledger balance, a
 * debit/credit check before submitting) we work in integer paise so repeated
 * addition cannot drift the way binary floats do.
 *
 * These are presentation aids only. The authoritative balances, totals and the
 * balanced-entry rule all come from the backend.
 */

const SCALE = 100;

/** Decimal string or number -> integer paise. */
export function toMinorUnits(value) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return 0;
  return Math.round(amount * SCALE);
}

/** Integer paise -> a number safe to hand to formatCurrency. */
export function fromMinorUnits(minor) {
  return minor / SCALE;
}

/** Sums a list of decimal values without accumulating float error. */
export function sumAmounts(values) {
  const total = values.reduce((sum, value) => sum + toMinorUnits(value), 0);
  return fromMinorUnits(total);
}

/**
 * Running balance for a list of posted ledger rows, following the account's
 * normal balance side - the same convention the backend uses in
 * getAccountBalance. Returns each row with a `balance` field appended.
 */
export function withRunningBalance(rows, accountType) {
  const debitNormal = ['ASSET', 'EXPENSE', 'BANK', 'CASH', 'OTHER_EXPENSE'].includes(
    accountType,
  );
  let running = 0;
  return rows.map((row) => {
    const debit = toMinorUnits(row.debit);
    const credit = toMinorUnits(row.credit);
    running += debitNormal ? debit - credit : credit - debit;
    return { ...row, balance: fromMinorUnits(running) };
  });
}

/**
 * Debit/credit totals for the journal-entry editor, plus whether they match.
 * The backend re-checks this and refuses to post an unbalanced entry.
 */
export function balanceOf(items) {
  const debit = items.reduce((sum, item) => sum + toMinorUnits(item.debit), 0);
  const credit = items.reduce((sum, item) => sum + toMinorUnits(item.credit), 0);
  return {
    totalDebit: fromMinorUnits(debit),
    totalCredit: fromMinorUnits(credit),
    difference: fromMinorUnits(debit - credit),
    isBalanced: debit === credit,
  };
}
