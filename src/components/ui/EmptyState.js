export default function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon = '📄',
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
}
