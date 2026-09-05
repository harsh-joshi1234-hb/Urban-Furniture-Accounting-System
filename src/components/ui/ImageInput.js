'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/utils/upload';
import { IMAGE_LIBRARY } from '@/utils/imageLibrary';
import { baseInput } from './Field';

const TABS = [
  { key: 'library', label: 'Library' },
  { key: 'upload', label: 'Upload' },
  { key: 'url', label: 'URL' },
];

export default function ImageInput({ value, onChange, label = 'Image' }) {
  const [mode, setMode] = useState('library');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Try the library or a URL instead.');
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-[13px] font-medium text-stone-700">{label}</label>
        <div className="flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5 text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                mode === tab.key
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'library' && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {IMAGE_LIBRARY.map((item) => {
            const selected = value === item.src;
            return (
              <button
                key={item.src}
                type="button"
                onClick={() => onChange(selected ? '' : item.src)}
                title={item.label}
                aria-pressed={selected}
                className={`group relative aspect-4/3 overflow-hidden rounded-lg border-2 transition-all duration-200 focus-ring ${
                  selected
                    ? 'border-brand-600 ring-2 ring-brand-100'
                    : 'border-transparent hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                {/* Local, licensed library assets - see public/images/furniture/CREDITS.md */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {selected && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {mode === 'upload' && (
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-stone-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          {uploading && <span className="shrink-0 text-sm text-stone-500">Uploading...</span>}
        </div>
      )}

      {mode === 'url' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={baseInput}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {value && !error && (
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Selected"
            className="h-12 w-12 shrink-0 rounded-md border border-stone-200 object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-stone-500">{value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
