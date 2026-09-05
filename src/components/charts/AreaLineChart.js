'use client';

import { useId, useState } from 'react';
import { formatCompactCurrency, formatCurrency } from '@/utils/format';

const INK = {
  primary: '#1c1917',
  secondary: '#57534e',
  muted: '#78716c',
  grid: '#eae5dd',
  baseline: '#d6ccbf',
};

/**
 * Monotone cubic (Fritsch-Carlson) tangents.
 *
 * A plain spline can overshoot between points and draw values the data never
 * held - unacceptable for money. This variant is shape-preserving: the curve
 * never rises above or dips below its neighbouring data points.
 */
function monotoneTangents(xs, ys) {
  const n = xs.length;
  if (n < 2) return [0];

  const slopes = [];
  for (let i = 0; i < n - 1; i += 1) {
    slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  const tangents = [slopes[0]];
  for (let i = 1; i < n - 1; i += 1) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents.push(0); // local extremum - flatten so the curve cannot overshoot
    } else {
      tangents.push((slopes[i - 1] + slopes[i]) / 2);
    }
  }
  tangents.push(slopes[n - 2]);

  // Clamp against the secants (the Fritsch-Carlson condition)
  for (let i = 0; i < n - 1; i += 1) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const a = tangents[i] / slopes[i];
      const b = tangents[i + 1] / slopes[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        tangents[i] = ((3 * a) / h) * slopes[i];
        tangents[i + 1] = ((3 * b) / h) * slopes[i];
      }
    }
  }
  return tangents;
}

function curvePath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const m = monotoneTangents(xs, ys);

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const h = xs[i + 1] - xs[i];
    d += ` C ${xs[i] + h / 3} ${ys[i] + (m[i] * h) / 3}, ${xs[i + 1] - h / 3} ${
      ys[i + 1] - (m[i + 1] * h) / 3
    }, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  return d;
}

/**
 * Trend over time as lines with a gradient wash fading beneath each curve.
 *
 * Colours are the validated warm pair (terracotta / teal) - they match the
 * walnut theme and clear the CVD and contrast gates, so identity survives
 * colour-blindness and printing. A legend plus an on-hover crosshair readout
 * mean the series are never told apart by hue alone.
 *
 * @param {Array} rows [{ label, values: [a, b] }]
 * @param {Array} series [{ name, color }]
 */
export default function AreaLineChart({
  rows = [],
  series = [],
  height = 260,
  valueFormatter = formatCompactCurrency,
  emptyMessage = 'Not enough data to plot.',
  className = '',
}) {
  const gradientId = useId().replace(/:/g, '');
  const [hoverIndex, setHoverIndex] = useState(null);

  const max = rows.reduce(
    (peak, row) => row.values.reduce((inner, v) => Math.max(inner, Number(v ?? 0)), peak),
    0,
  );

  if (rows.length === 0 || max === 0) {
    return <div className={`px-4 py-12 text-sm text-stone-500 ${className}`}>{emptyMessage}</div>;
  }

  const width = 760;
  const padLeft = 62;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  // Round the axis up to a calm step so gridlines stay recessive.
  const niceMax = (() => {
    const raw = max * 1.15;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    return Math.ceil(raw / magnitude) * magnitude;
  })();

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => niceMax * t);
  const stepX = rows.length > 1 ? plotWidth / (rows.length - 1) : 0;
  const xOf = (i) => padLeft + (rows.length > 1 ? i * stepX : plotWidth / 2);
  const yOf = (v) => padTop + plotHeight - (Number(v ?? 0) / niceMax) * plotHeight;

  const seriesPoints = series.map((_, sIndex) =>
    rows.map((row, i) => ({ x: xOf(i), y: yOf(row.values[sIndex]) })),
  );

  return (
    <figure className={`relative m-0 ${className}`}>
      <div className="flex flex-wrap gap-4 px-4 pt-3">
        {series.map((entry) => (
          <span
            key={entry.name}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600"
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: entry.color, printColorAdjust: 'exact' }}
            />
            {entry.name}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`${series.map((s) => s.name).join(' and ')} over time`}
        style={{ display: 'block', maxWidth: '100%', printColorAdjust: 'exact' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          {series.map((entry, sIndex) => (
            <linearGradient
              key={entry.name}
              id={`${gradientId}-fill-${sIndex}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity="0.28" />
              <stop offset="55%" stopColor={entry.color} stopOpacity="0.10" />
              <stop offset="100%" stopColor={entry.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* gridlines + value axis */}
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
              x={padLeft - 10}
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

        {/* crosshair for the hovered month, drawn under the marks */}
        {hoverIndex !== null && (
          <line
            x1={xOf(hoverIndex)}
            y1={padTop}
            x2={xOf(hoverIndex)}
            y2={padTop + plotHeight}
            stroke={INK.baseline}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* area wash then line, per series */}
        {series.map((entry, sIndex) => {
          const points = seriesPoints[sIndex];
          const line = curvePath(points);
          const area = `${line} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${
            points[0].x
          } ${padTop + plotHeight} Z`;
          return (
            <g key={entry.name}>
              <path d={area} fill={`url(#${gradientId}-fill-${sIndex})`} />
              <path
                d={line}
                fill="none"
                stroke={entry.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ printColorAdjust: 'exact' }}
              />
            </g>
          );
        })}

        {/* points - enlarged on the hovered month */}
        {series.map((entry, sIndex) =>
          seriesPoints[sIndex].map((point, i) => (
            <circle
              key={`${entry.name}-${i}`}
              cx={point.x}
              cy={point.y}
              r={hoverIndex === i ? 5 : 3.5}
              fill="#ffffff"
              stroke={entry.color}
              strokeWidth="2"
              style={{ printColorAdjust: 'exact', transition: 'r 120ms ease-out' }}
            />
          )),
        )}

        {/* month labels + generous hover targets */}
        {rows.map((row, i) => (
          <g key={row.label}>
            <text
              x={xOf(i)}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill={hoverIndex === i ? INK.primary : INK.secondary}
              fontWeight={hoverIndex === i ? 600 : 400}
            >
              {row.label}
            </text>
            <rect
              x={xOf(i) - (stepX || plotWidth) / 2}
              y={padTop}
              width={stepX || plotWidth}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            >
              <title>
                {`${row.label} - ${series
                  .map((s, si) => `${s.name}: ${formatCurrency(row.values[si])}`)
                  .join(', ')}`}
              </title>
            </rect>
          </g>
        ))}
      </svg>

      {/* readout for the hovered month */}
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-10 z-10 min-w-[9.5rem] rounded-lg border border-stone-200 bg-white/97 p-2.5 shadow-md backdrop-blur print:hidden"
          style={{
            left: `${(xOf(hoverIndex) / width) * 100}%`,
            transform:
              hoverIndex > rows.length / 2 ? 'translateX(-108%)' : 'translateX(8%)',
          }}
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {rows[hoverIndex].label}
          </p>
          {series.map((entry, sIndex) => (
            <p key={entry.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-stone-600">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-semibold tabular text-stone-900">
                {formatCurrency(rows[hoverIndex].values[sIndex])}
              </span>
            </p>
          ))}
        </div>
      )}
    </figure>
  );
}
