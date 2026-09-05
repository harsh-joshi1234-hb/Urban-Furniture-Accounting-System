'use client';

import { useEffect, useRef } from 'react';
import { formatCurrency, formatNumber } from '@/utils/format';
import Button from './Button';

export default function PieChartModal({ isOpen, onClose, data }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Data processing
  const achieved = Number(data.achievedAmount) || 0;
  const committed = Number(data.committedAmount) || 0;
  const balance = Math.max(0, committed - achieved);
  const total = achieved + balance || 1; // avoid division by zero

  const achievedPct = (achieved / total) * 100;
  const balancePct = (balance / total) * 100;

  // SVG Pie chart calculation
  // Circle radius 15.9155 creates a circumference of 100, which makes stroke-dasharray percentages easy
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius; // approx 100

  // The stroke-dasharray is "segment_length gap_length"
  const achievedDash = `${achievedPct} ${circumference - achievedPct}`;
  const balanceDash = `${balancePct} ${circumference - balancePct}`;

  // Balance starts where Achieved ends (Achieved starts at offset 25 because stroke-dashoffset starts at 3 o'clock and we want it to start at 12 o'clock)
  const balanceOffset = 100 - achievedPct + 25;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md scale-100 transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold leading-6 text-slate-900">
            Budget Distribution
          </h3>
          <button
            type="button"
            className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6">{data.name}</p>

          <div className="relative mx-auto h-48 w-48">
            <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90 transform drop-shadow-md">
              {/* Background circle (in case we have 0 for everything) */}
              <circle
                cx="21"
                cy="21"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0" // slate-200
                strokeWidth="8"
              />

              {/* Achieved Segment */}
              {achievedPct > 0 && (
                <circle
                  cx="21"
                  cy="21"
                  r={radius}
                  fill="transparent"
                  stroke="#06b6d4" // cyan-500
                  strokeWidth="8"
                  strokeDasharray={achievedDash}
                  strokeDashoffset="25" // Start at top (12 o'clock is 25 offset backward since standard is 3 o'clock)
                  className="transition-all duration-1000 ease-out"
                />
              )}

              {/* Balance Segment */}
              {balancePct > 0 && (
                <circle
                  cx="21"
                  cy="21"
                  r={radius}
                  fill="transparent"
                  stroke="#f43f5e" // rose-500
                  strokeWidth="8"
                  strokeDasharray={balanceDash}
                  strokeDashoffset={balanceOffset}
                  className="transition-all duration-1000 ease-out"
                />
              )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-700">
                {formatNumber(achievedPct, 1)}%
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Achieved</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm" />
                <span className="text-xs font-semibold text-cyan-800 uppercase">Achieved</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(achieved)}</span>
              <span className="text-xs text-slate-500">{formatNumber(achievedPct, 1)}%</span>
            </div>

            <div className="flex flex-col items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                <span className="text-xs font-semibold text-rose-800 uppercase">Balance</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(balance)}</span>
              <span className="text-xs text-slate-500">{formatNumber(balancePct, 1)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
