'use client';

import { useCallback, useState } from 'react';

/**
 * Wraps a mutating call so buttons can be disabled while it is in flight and
 * validation / conflict errors from the backend surface consistently.
 */
export function useSubmit(action, { onSuccess, onError } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(
    async (...args) => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await action(...args);
        if (onSuccess) await onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        if (onError) onError(err);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [action, onSuccess, onError],
  );

  return { submit, submitting, error, setError };
}

export default useSubmit;
