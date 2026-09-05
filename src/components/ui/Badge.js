import { STATUS_TONES } from '@/utils/constants';
import { titleCase } from '@/utils/format';

const TONES = {
  slate: { chip: 'bg-stone-50 text-stone-700 ring-stone-200', dot: 'bg-stone-400' },
  blue: { chip: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  amber: { chip: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  green: { chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  red: { chip: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-500' },
  brand: { chip: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-500' },
};

/**
 * Status chip. A leading dot carries the state alongside the colour, so status
 * is never communicated by hue alone.
 */
export default function Badge({ status, tone, children, dot = true, className = '' }) {
  const resolved = TONES[tone || STATUS_TONES[status] || 'slate'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${resolved.chip} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${resolved.dot}`} aria-hidden="true" />
      )}
      {children ?? titleCase(status)}
    </span>
  );
}
