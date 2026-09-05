'use client';

import { avatarTone, initialsOf } from '@/utils/imageLibrary';

const SIZES = {
  sm: 'h-8 w-8 text-[11px] rounded-lg',
  md: 'h-10 w-10 text-xs rounded-lg',
  lg: 'h-16 w-16 text-base rounded-xl',
};

/**
 * Square thumbnail for a contact or product.
 * Falls back to deterministic initials when there is no image, so a list never
 * shows a broken-image icon or a ragged empty cell.
 */
export default function Avatar({ src, name, size = 'sm', className = '' }) {
  const tone = avatarTone(name || '');

  if (src) {
    return (
      // Plain <img>: sources are user-supplied URLs or uploads, so the
      // next/image loader cannot be configured for them ahead of time.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Image'}
        loading="lazy"
        className={`shrink-0 border border-stone-200 object-cover ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border border-stone-200 font-semibold ${SIZES[size]} ${className}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {initialsOf(name)}
    </span>
  );
}
