export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-stone-200 bg-white card-shadow transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(16,24,40,0.04),0_8px_20px_rgba(16,24,40,0.08)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-semibold tracking-tight text-stone-900">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const TONES = {
  slate: { value: 'text-stone-900', accent: 'bg-stone-400', chip: 'bg-stone-100 text-stone-600' },
  green: { value: 'text-emerald-700', accent: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  red: { value: 'text-red-700', accent: 'bg-red-500', chip: 'bg-red-50 text-red-700' },
  brand: { value: 'text-brand-700', accent: 'bg-brand-500', chip: 'bg-brand-50 text-brand-700' },
  amber: { value: 'text-amber-700', accent: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
};

/**
 * Headline figure. The number is the loudest thing on the card - large, tight
 * and tabular - with a coloured rail so the important tiles read at a glance.
 */
export function StatCard({ label, value, hint, tone = 'slate', icon, className = '' }) {
  const palette = TONES[tone] || TONES.slate;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4 pl-5 card-shadow transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_4px_8px_rgba(16,24,40,0.06),0_12px_24px_rgba(16,24,40,0.10)] ${className}`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5 ${palette.accent}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${palette.chip}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight tabular ${palette.value}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-snug text-stone-500">{hint}</p>}
    </div>
  );
}
