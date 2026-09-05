/**
 * Built-in furniture image library.
 *
 * Files live in public/images/furniture and ship with the app, so records keep
 * working offline and nothing is hot-linked at runtime. Source and licence are
 * recorded in public/images/furniture/CREDITS.md (Unsplash Licence - free for
 * commercial use, no attribution required).
 */
export const IMAGE_LIBRARY = [
  { src: '/images/furniture/sofa-grey.jpg', label: 'Grey sofa', tags: ['sofa', 'living'] },
  { src: '/images/furniture/sofa-modern.jpg', label: 'Modern sofa', tags: ['sofa', 'living'] },
  { src: '/images/furniture/sofa-lounge.jpg', label: 'Lounge sofa', tags: ['sofa', 'living'] },
  { src: '/images/furniture/armchair.jpg', label: 'Armchair', tags: ['chair', 'living'] },
  { src: '/images/furniture/living-set.jpg', label: 'Living room set', tags: ['living', 'combo'] },
  { src: '/images/furniture/dining-table.jpg', label: 'Dining table', tags: ['table', 'dining'] },
  { src: '/images/furniture/dining-set.jpg', label: 'Dining set', tags: ['dining', 'combo'] },
  { src: '/images/furniture/dining-room.jpg', label: 'Dining room', tags: ['dining'] },
  { src: '/images/furniture/wardrobe.jpg', label: 'Wardrobe', tags: ['storage', 'bedroom'] },
  { src: '/images/furniture/bedroom-storage.jpg', label: 'Bedroom storage', tags: ['storage', 'bedroom'] },
  { src: '/images/furniture/cabinet.jpg', label: 'Cabinet', tags: ['storage'] },
  { src: '/images/furniture/shelving.jpg', label: 'Shelving unit', tags: ['storage', 'office'] },
];

/** Deterministic avatar palette - the same name always gets the same colour. */
const AVATAR_TONES = [
  { bg: '#eef2ff', fg: '#4338ca' },
  { bg: '#ecfdf5', fg: '#047857' },
  { bg: '#fff7ed', fg: '#c2410c' },
  { bg: '#eff6ff', fg: '#1d4ed8' },
  { bg: '#fdf4ff', fg: '#a21caf' },
  { bg: '#f0fdfa', fg: '#0f766e' },
];

export function avatarTone(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
