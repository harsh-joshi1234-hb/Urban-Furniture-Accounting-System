'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import reportService from '@/services/report.api';

/** First and last day of the calendar month `offset` months before now. */
function monthRange(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  return {
    label: start.toLocaleDateString('en-IN', { month: 'short' }),
    startDate: iso(start),
    endDate: iso(end),
  };
}

/**
 * Real income and expenses for each of the last `months` calendar months.
 *
 * Each month is a separate backend profit-and-loss call, so every figure is
 * computed by the accounting engine from posted journal entries. Nothing here
 * is estimated, scaled or interpolated from a single total.
 */
export function useMonthlyTrend(months = 6) {
  const [token, setToken] = useState(0);
  const [state, setState] = useState({ token: -1, data: [], error: null });

  const ranges = useMemo(
    () => Array.from({ length: months }, (_, i) => monthRange(months - 1 - i)),
    [months],
  );

  const reload = useCallback(() => setToken((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      ranges.map((range) =>
        reportService
          .profitAndLoss({ startDate: range.startDate, endDate: range.endDate })
          .then((response) => ({
            label: range.label,
            income: Number(response?.data?.totalIncome ?? 0),
            expenses: Number(response?.data?.totalExpenses ?? 0),
            netIncome: Number(response?.data?.netIncome ?? 0),
          }))
          // One bad month must not blank the whole chart.
          .catch(() => ({ label: range.label, income: 0, expenses: 0, netIncome: 0 })),
      ),
    )
      .then((data) => {
        if (!cancelled) setState({ token, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ token, data: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [ranges, token]);

  const settled = state.token === token;

  return {
    months: settled ? state.data : [],
    loading: !settled,
    error: settled ? state.error : null,
    reload,
  };
}

export default useMonthlyTrend;
