/** Presentation helpers. No financial logic lives here - the backend owns totals. */

export function formatCurrency(value) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value, digits = 2) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '-';
  return amount.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** yyyy-mm-dd for <input type="date"> */
export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateString, days) {
  const date = dateString ? new Date(dateString) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sums the line totals that the backend already computed for a document.
 * This is a display aggregation of server values, never a re-pricing.
 */
export function sumLineTotals(lines) {
  if (!Array.isArray(lines)) return 0;
  return lines.reduce((sum, line) => sum + Number(line.total ?? 0), 0);
}

/** Sums backend-provided payment allocations for an invoice / bill. */
export function sumAllocations(allocations) {
  if (!Array.isArray(allocations)) return 0;
  return allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocatedAmount ?? 0),
    0,
  );
}
