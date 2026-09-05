'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Loads a resource and exposes the loading / error / empty states that every
 * page in this app is required to render.
 *
 * State is only written from promise callbacks, so a re-fetch never triggers a
 * cascading synchronous render.
 *
 * @param {Function} fetcher async () => backend envelope { success, data }
 * @param {Array} deps values that re-trigger the fetch when they change
 */
export function useApiResource(fetcher, deps = [], { enabled = true } = {}) {
  const key = JSON.stringify(deps ?? []);
  const [token, setToken] = useState(0);
  const [result, setResult] = useState({ key: null, token: -1, data: null, error: null });

  const reload = useCallback(() => setToken((current) => current + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    Promise.resolve()
      .then(() => fetcher())
      .then((response) => {
        if (cancelled) return;
        setResult({ key, token, data: response?.data ?? null, error: null });
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') return;
        setResult({ key, token, data: null, error });
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is re-created every render by design; `key` tracks its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token, enabled]);

  const settled = result.key === key && result.token === token;

  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: enabled && !settled,
    reload,
  };
}

export default useApiResource;
