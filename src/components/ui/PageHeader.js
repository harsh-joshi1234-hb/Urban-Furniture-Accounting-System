import Link from 'next/link';

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  actions,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            &larr; {backLabel}
          </Link>
        )}
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
