import Link from 'next/link';

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  actions,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex items-center text-xs font-medium text-stone-500 hover:text-brand-600"
          >
            &larr; {backLabel}
          </Link>
        )}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-stone-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
