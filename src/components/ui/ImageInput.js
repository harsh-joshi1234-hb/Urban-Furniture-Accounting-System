'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/utils/upload';
import { TextField } from './Field';

export default function ImageInput({ value, onChange, label = 'Image' }) {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
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
      setError('Failed to upload image. Try using a URL instead.');
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 rounded transition ${mode === 'url' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 rounded transition ${mode === 'upload' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      ) : (
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {uploading && <span className="text-sm text-slate-500">Uploading...</span>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      {value && !error && (
        <div className="mt-2 text-xs text-slate-500 truncate">
          Current: <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{value}</a>
        </div>
      )}
    </div>
  );
}
