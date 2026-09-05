import Button from './Button';

const TITLES = {
  0: 'Cannot reach the server',
  400: 'Invalid request',
  401: 'Session expired',
  403: 'Access denied',
  404: 'Not found',
  409: 'Conflict',
  422: 'Invalid request',
  500: 'Server error',
};

export default function ErrorState({ error, onRetry, className = '' }) {
  const status = error?.status;
  const title = TITLES[status] || 'Something went wrong';
  const message =
    error?.message || 'The request could not be completed. Please try again.';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-12 text-center ${className}`}
      role="alert"
    >
      <span className="text-3xl" aria-hidden="true">
        ⚠️
      </span>
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      <p className="max-w-md text-sm text-stone-500">{message}</p>
      {status ? <p className="text-xs text-stone-400">HTTP {status}</p> : null}
      {onRetry && status !== 403 && (
        <div className="pt-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline form-level error banner (400 / 409 / 422 responses). */
export function FormError({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {error.message}
    </div>
  );
}
