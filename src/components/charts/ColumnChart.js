'use client';

import { formatCompactCurrency, formatCurrency } from '@/utils/format';

const INK = {
  secondary: '#57534e',
  muted: '#78716c',
  grid: '#eae5dd',
  baseline: '#d6ccbf',
};

/**
 * Grouped vertical columns for month-by-month comparison (income vs expenses).
 * Inline SVG so it renders identically in the browser and in a printed PDF.
 *
 * @param {Array} rows [{ label, values: [a, b] }]
 * @param {Array} series [{ name, color }]
 */
export default function ColumnChart({
  rows = [],
  series = [],
  height = 240,
  valueFormatter = formatCompactCurrency,
  emptyMessage = 'Not enough data to plot.',
  className = '',
}) {
  const max = rows.reduce(
    (peak, row) => row.values.reduce((inner, v) => Math.max(inner, Number(v ?? 0)), peak),
    0,
  );

  if (rows.length === 0 || max === 0) {
    return <div className={`px-4 py-12 text-sm text-stone-500 ${className}`}>{emptyMessage}</div>;
  }

  const width = 720;
  const padLeft = 58;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const niceMax = (() => {
    const raw = max * 1.12;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    return Math.ceil(raw / magnitude) * magnitude;
  })();

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => niceMax * t);
  const groupWidth = plotWidth / rows.length;
  const barGap = 2; // surface gap between adjacent fills
  const barWidth = Math.min(
    24,
    (groupWidth * 0.6 - barGap * (series.length - 1)) / series.length,
  );
  const yOf = (value) => padTop + plotHeight - (Number(value ?? 0) / niceMax) * plotHeight;

  return (
    <figure className={`m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={series.map((s) => s.name).join(' and ')}
        style={{ display: 'block', maxWidth: '100%', printColorAdjust: 'exact' }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={yOf(tick)}
              x2={width - padRight}
              y2={yOf(tick)}
              stroke={tick === 0 ? INK.baseline : INK.grid}
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={yOf(tick) + 4}
              textAnchor="end"
              fontSize="10"
              fill={INK.muted}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {valueFormatter(tick)}
            </text>
          </g>
        ))}

        {rows.map((row, rowIndex) => {
          const groupLeft = padLeft + rowIndex * groupWidth;
          const groupInner = barWidth * series.length + barGap * (series.length - 1);
          const startX = groupLeft + (groupWidth - groupInner) / 2;

          return (
            <g key={row.label}>
              {row.values.map((value, seriesIndex) => {
                const x = startX + seriesIndex * (barWidth + barGap);
                const y = yOf(value);
                const barH = padTop + plotHeight - y;
                const color = series[seriesIndex]?.color;
                const r = Math.min(4, barWidth / 2, barH);
                if (barH <= 0) return null;
                return (
                  <path
                    key={seriesIndex}
                    d={`M ${x} ${y + barH} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${
                      x + barWidth - r
                    } Q ${x + barWidth} ${y} ${x + barWidth} ${y + r} V ${y + barH} Z`}
                    fill={color}
                    style={{ printColorAdjust: 'exact' }}
                  >
                    <title>
                      {`${row.label} - ${series[seriesIndex]?.name}: ${formatCurrency(value)}`}
                    </title>
                  </path>
                );
              })}

              <text
                x={groupLeft + groupWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill={INK.secondary}
              >
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
