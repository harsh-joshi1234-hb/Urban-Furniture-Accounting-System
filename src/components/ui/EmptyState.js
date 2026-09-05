export default function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon = '📄',
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
}
