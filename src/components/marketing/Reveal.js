'use client';

import { useEffect, useRef, useState } from 'react';

/** Nothing stays hidden longer than this, whatever the observer does. */
const SAFETY_MS = 1200;

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * Deliberately fail-open: the content is visible in the server-rendered HTML and
 * only becomes hideable once this component has mounted and armed it
 * (`data-armed`). If JavaScript never runs, IntersectionObserver is missing, the
 * tab is not painting, or the visitor asks for reduced motion, the content shows
 * anyway. A safety timer also reveals everything after a moment, so a section
 * can never be left permanently blank.
 */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      return undefined; // never armed - content simply stays visible
    }

    // Already in view at mount (or the browser reports it immediately)?
    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return undefined;

    setArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.unobserve(entry.target); // reveal once, then stop watching
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);

    // Backstop: if the observer never reports (throttled or background tab),
    // show the content rather than leaving a blank section.
    const safety = setTimeout(() => setShown(true), SAFETY_MS + delay);

    const onScroll = () => {
      const box = node.getBoundingClientRect();
      if (box.top < window.innerHeight - 40 && box.bottom > 0) setShown(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      clearTimeout(safety);
      window.removeEventListener('scroll', onScroll);
    };
  }, [delay]);

  return (
    <Tag
      ref={ref}
      data-armed={armed ? 'true' : undefined}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
