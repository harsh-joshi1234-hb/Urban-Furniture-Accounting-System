/**
 * Visual representation of a backend-supplied percentage (budget achieved %).
 * Purely presentational - the value is never recomputed here.
 */
export default function ProgressBar({ value, className = '' }) {
  const pct = Number(value ?? 0);
  const safe = Number.isNaN(pct) ? 0 : Math.max(0, Math.min(pct, 100));
  const tone =
    pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-stone-100 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${safe}%` }} />
    </div>
  );
}
