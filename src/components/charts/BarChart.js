'use client';

import { formatCompactCurrency, formatCurrency } from '@/utils/format';

/**
 * Horizontal bar charts for the financial reports, drawn as inline SVG so they
 * survive Print / Save-as-PDF without a chart library or any network request.
 *
 * Palette slots (validated against a white surface for CVD and contrast):
 *   series 1 blue #2a78d6 - series 2 orange #eb6834 - series 3 aqua #1baf7a
 * Every mark is direct-labelled and every chart sits directly above its own
 * data table, so identity is never carried by colour alone.
 */

/*
 * Categorical slots. The warm pair (terracotta / teal) matches the walnut theme
 * and clears every gate on a white surface: CVD deltaE 13.7 (target >=8),
 * normal-vision 27.1 (floor 15), all >=3:1 contrast. Adding blue as a third
 * slot also passes, so the balance sheet can show three sections.
 */
export const SERIES = {
  terracotta: '#c2410c',
  teal: '#0d9488',
  blue: '#1d4ed8',
  // legacy aliases kept so older call sites keep working
  orange: '#c2410c',
  aqua: '#0d9488',
};

const INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  baseline: '#c3c2b7',
};

const VIEW_WIDTH = 720;
const LABEL_WIDTH = 196;
const VALUE_WIDTH = 96;
const PLOT_LEFT = LABEL_WIDTH;
const PLOT_RIGHT = VIEW_WIDTH - VALUE_WIDTH;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

/** Bar path with the data end rounded 4px and the baseline end square. */
function barPath(x, y, width, height, radius = 4) {
  const r = Math.max(0, Math.min(radius, width, height / 2));
  if (width <= 0) return '';
  return [
    `M ${x} ${y}`,
    `H ${x + width - r}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `V ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    `H ${x}`,
    'Z',
  ].join(' ');
}

function truncate(text, max = 30) {
  const value = String(text ?? '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * @param {Array} rows [{ label, value }] or [{ label, values: [a, b] }]
 * @param {Array} series [{ name, color }] - one entry per value
 */
export default function BarChart({
  rows = [],
  series = [{ name: 'Amount', color: SERIES.blue }],
  title,
  valueFormatter = formatCompactCurrency,
  tooltipFormatter = formatCurrency,
  emptyMessage = 'No amounts to plot.',
  className = '',
}) {
  const normalised = rows.map((row) => ({
    label: row.label,
    values: row.values ?? [row.value],
  }));

  const max = normalised.reduce(
    (peak, row) =>
      row.values.reduce((inner, value) => Math.max(inner, Math.abs(Number(value ?? 0))), peak),
    0,
  );

  if (normalised.length === 0 || max === 0) {
    return (
      <div className={`px-4 py-6 text-sm text-stone-500 ${className}`}>{emptyMessage}</div>
    );
  }

  const multi = series.length > 1;
  const barHeight = multi ? 11 : 15;
  const barGap = 2; // surface gap between adjacent fills
  const rowHeight = multi ? barHeight * series.length + barGap + 20 : barHeight + 18;
  const topPad = 8;
  const height = topPad + normalised.length * rowHeight + 8;
  const scale = (value) => (Math.abs(Number(value ?? 0)) / max) * PLOT_WIDTH;

  return (
    <figure className={`m-0 ${className}`}>
      {title && (
        <figcaption className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-stone-600">
          {title}
        </figcaption>
      )}

      {multi && (
        <div className="flex flex-wrap gap-4 px-4 pt-2">
          {series.map((entry) => (
            <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs text-stone-600">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: entry.color, printColorAdjust: 'exact' }}
              />
              {entry.name}
            </span>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={title || 'Bar chart'}
        style={{ display: 'block', maxWidth: '100%', printColorAdjust: 'exact' }}
      >
        {/* Zero baseline - every bar is anchored here */}
        <line
          x1={PLOT_LEFT}
          y1={topPad - 2}
          x2={PLOT_LEFT}
          y2={height - 6}
          stroke={INK.baseline}
          strokeWidth="1"
        />

        {normalised.map((row, rowIndex) => {
          const rowTop = topPad + rowIndex * rowHeight;
          const groupHeight = multi ? barHeight * series.length + barGap : barHeight;
          const labelY = rowTop + groupHeight / 2 + 4;

          return (
            <g key={`${row.label}-${rowIndex}`}>
              <text
                x={PLOT_LEFT - 10}
                y={labelY}
                textAnchor="end"
                fontSize="12"
                fill={INK.secondary}
              >
                {truncate(row.label)}
                <title>{row.label}</title>
              </text>

              {row.values.map((value, seriesIndex) => {
                const width = scale(value);
                const y = rowTop + seriesIndex * (barHeight + barGap);
                const color = series[seriesIndex]?.color || SERIES.blue;
                return (
                  <g key={seriesIndex}>
                    <path
                      d={barPath(PLOT_LEFT, y, width, barHeight)}
                      fill={color}
                      style={{ printColorAdjust: 'exact' }}
                    >
                      <title>
                        {`${row.label} - ${series[seriesIndex]?.name || 'Amount'}: ${tooltipFormatter(value)}`}
                      </title>
                    </path>
                    <text
                      x={PLOT_LEFT + width + 8}
                      y={y + barHeight - 2}
                      fontSize="11"
                      fill={INK.primary}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {valueFormatter(value)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * Two stacked totals side by side - used by the balance sheet to show
 * Assets against Liabilities + Capital.
 *
 * @param {Array} bars [{ label, segments: [{ name, value, color }] }]
 */
export function StackedComparison({ bars = [], title, className = '' }) {
  const totals = bars.map((bar) =>
    bar.segments.reduce((sum, segment) => sum + Math.abs(Number(segment.value ?? 0)), 0),
  );
  const max = Math.max(...totals, 0);

  if (bars.length === 0 || max === 0) {
    return (
      <div className={`px-4 py-6 text-sm text-stone-500 ${className}`}>
        No balances to plot.
      </div>
    );
  }

  const barHeight = 26;
  const rowHeight = barHeight + 30;
  const topPad = 10;
  const height = topPad + bars.length * rowHeight;
  const legend = bars
    .flatMap((bar) => bar.segments)
    .filter(
      (segment, index, all) => all.findIndex((s) => s.name === segment.name) === index,
    );

  return (
    <figure className={`m-0 ${className}`}>
      {title && (
        <figcaption className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-stone-600">
          {title}
        </figcaption>
      )}

      <div className="flex flex-wrap gap-4 px-4 pt-2">
        {legend.map((segment) => (
          <span key={segment.name} className="inline-flex items-center gap-1.5 text-xs text-stone-600">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: segment.color, printColorAdjust: 'exact' }}
            />
            {segment.name}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={title || 'Balance comparison'}
        style={{ display: 'block', maxWidth: '100%', printColorAdjust: 'exact' }}
      >
        <line
          x1={PLOT_LEFT}
          y1={topPad - 4}
          x2={PLOT_LEFT}
          y2={height - 10}
          stroke={INK.baseline}
          strokeWidth="1"
        />

        {bars.map((bar, barIndex) => {
          const rowTop = topPad + barIndex * rowHeight;
          const total = totals[barIndex];
          let cursor = PLOT_LEFT;

          return (
            <g key={bar.label}>
              <text
                x={PLOT_LEFT - 10}
                y={rowTop + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fill={INK.secondary}
              >
                {truncate(bar.label, 26)}
              </text>

              {bar.segments.map((segment, segmentIndex) => {
                const value = Math.abs(Number(segment.value ?? 0));
                const width = (value / max) * PLOT_WIDTH;
                const isLast = segmentIndex === bar.segments.length - 1;
                const x = cursor;
                // 2px surface gap between stacked segments
                cursor += width + (isLast ? 0 : 2);
                if (width <= 0) return null;
                return (
                  <g key={segment.name}>
                    <path
                      d={
                        isLast
                          ? barPath(x, rowTop, width, barHeight)
                          : `M ${x} ${rowTop} h ${width} v ${barHeight} h ${-width} Z`
                      }
                      fill={segment.color}
                      style={{ printColorAdjust: 'exact' }}
                    >
                      <title>{`${segment.name}: ${formatCurrency(segment.value)}`}</title>
                    </path>
                    {width > 70 && (
                      <text
                        x={x + 8}
                        y={rowTop + barHeight / 2 + 4}
                        fontSize="11"
                        fill="#ffffff"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatCompactCurrency(segment.value)}
                      </text>
                    )}
                  </g>
                );
              })}

              <text
                x={PLOT_LEFT}
                y={rowTop + barHeight + 16}
                fontSize="11"
                fill={INK.muted}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                Total {formatCurrency(total)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
