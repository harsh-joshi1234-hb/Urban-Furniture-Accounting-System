'use client';

import { useCallback, useEffect, useState } from 'react';
import portalService from '@/services/portal.service';
import { sumAllocations, sumLineTotals } from '@/utils/format';

const DETAIL_FETCH_LIMIT = 50;

async function loadInvoices() {
  const response = await portalService.invoices();
  const list = response?.data ?? [];

  // The list endpoint returns lines but not allocations, so each invoice detail
  // is fetched (bounded) to read the backend's allocation records.
  const detailed = await Promise.all(
    list.slice(0, DETAIL_FETCH_LIMIT).map(async (invoice) => {
      try {
        const detail = await portalService.invoice(invoice.id);
        return detail?.data ?? invoice;
      } catch {
        return invoice;
      }
    }),
  );

  return [...detailed, ...list.slice(DETAIL_FETCH_LIMIT)].map((invoice) => {
    const total = sumLineTotals(invoice.lines);
    const paid = sumAllocations(invoice.allocations);
    return { ...invoice, total, paid, amountDue: Math.max(total - paid, 0) };
  });
}

/**
 * Invoices belonging to the signed-in customer. Totals and paid amounts are
 * sums of backend values, never re-priced on the client.
 */
export function usePortalInvoices() {
  const [token, setToken] = useState(0);
  const [state, setState] = useState({ token: -1, invoices: [], error: null });

  const reload = useCallback(() => setToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(loadInvoices)
      .then((invoices) => {
        if (!cancelled) setState({ token, invoices, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ token, invoices: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const settled = state.token === token;

  return {
    invoices: settled ? state.invoices : [],
    error: settled ? state.error : null,
    loading: !settled,
    reload,
  };
}

export default usePortalInvoices;
