'use client';

import { useEffect } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const width = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-5 elevated ${width}`}
      >
        {title && (
          <h2 className="text-base font-semibold tracking-tight text-stone-900">{title}</h2>
        )}
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
        <div className="mt-4">{children}</div>
        {footer && (
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
