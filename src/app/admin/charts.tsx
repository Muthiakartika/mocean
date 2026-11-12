/**
 * Charts of the admin's Reports page, drawn as SVG/HTML on the server (no chart library). One series per chart in the
 * brand navy; months still ahead are hatched (booked so far, may grow) and named in the legend, so the difference is
 * never colour alone. Every bar shows its figures on hover or keyboard focus, and each chart has a table view.
 */

export type MonthPoint = {
  /** "Nov 2026" */
  label: string;
  /** "Nov" */
  short: string;
  value: number;
  /** A month after the current one: what is booked so far. */
  ahead: boolean;
  /** Tooltip lines, e.g. ["23 guests", "5 bookings"]. */
  detail: string[];
};

const W = 720;
const H = 250;
const PAD = { top: 26, right: 16, bottom: 30, left: 60 };

/** A round top for the axis and four even steps under it. */
function niceScale(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ?? 10 * power;
  return [0, 1, 2, 3, 4].map((index) => index * step);
}

/** Column with a 4px round top, square on the baseline. */
function column(x: number, y: number, width: number, height: number) {
  const r = Math.min(4, height, width / 2);
  if (height <= 0) return "";
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

export function MonthBars({
  id,
  title,
  points,
  axis,
  average,
}: {
  id: string;
  title: string;
  points: MonthPoint[];
  /** Tick text, e.g. (v) => "IDR 20M". */
  axis: (value: number) => string;
  /** Reference line, e.g. { value: 18, label: "Average 18" }. */
  average?: { value: number; label: string };
}) {
  const ticks = niceScale(Math.max(...points.map((point) => point.value), average?.value ?? 0));
  const top = ticks[ticks.length - 1];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / points.length;
  const barW = Math.min(24, band - 8);
  const y = (value: number) => PAD.top + plotH - (value / top) * plotH;
  const peak = points.reduce((best, point, index) => (point.value > points[best].value ? index : best), 0);
  const hasAhead = points.some((point) => point.ahead);

  return (
    <figure className="adm-chart">
      {hasAhead && (
        <ul className="adm-legend" aria-label="Legend">
          <li>
            <span className="adm-swatch" /> Past and this month
          </li>
          <li>
            <span className="adm-swatch adm-swatch--ahead" /> Ahead (booked so far)
          </li>
        </ul>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart-svg" role="group" aria-label={title}>
        <defs>
          <pattern id={`hatch-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="adm-hatch-bg" />
            <line x1="0" y1="0" x2="0" y2="6" className="adm-hatch-line" />
          </pattern>
        </defs>

        {ticks.map((tick) => (
          <g key={tick} className="adm-grid-line">
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
            <text x={PAD.left - 10} y={y(tick) + 4} textAnchor="end">
              {axis(tick)}
            </text>
          </g>
        ))}

        {average && average.value > 0 && (
          <g className="adm-avg">
            <line x1={PAD.left} x2={W - PAD.right} y1={y(average.value)} y2={y(average.value)} />
            <text x={W - PAD.right} y={y(average.value) - 6} textAnchor="end">
              {average.label}
            </text>
          </g>
        )}

        {points.map((point, index) => {
          const cx = PAD.left + band * index + band / 2;
          const barY = y(point.value);
          // Wide enough for the longest line (12px Quicksand is about 7px a character).
          const tipW = Math.max(140, Math.max(...[point.label + " (so far)", ...point.detail].map((line) => line.length)) * 7 + 26);
          const tipX = Math.min(Math.max(cx - tipW / 2, 4), W - tipW - 4);
          const tipY = Math.max(barY - 16 - 18 * (point.detail.length + 1), 2);
          return (
            <g key={point.label} className="adm-col" tabIndex={0} aria-label={`${point.label}: ${point.detail.join(", ")}${point.ahead ? " (booked so far)" : ""}`}>
              {/* Hit area: the whole column of the month, wider than the bar. */}
              <rect x={PAD.left + band * index} y={PAD.top} width={band} height={plotH} className="adm-col-hit" />
              {/* Inline style: the stylesheet's navy fill would beat a fill attribute. */}
              <path
                d={column(cx - barW / 2, barY, barW, PAD.top + plotH - barY)}
                style={point.ahead ? { fill: `url(#hatch-${id})` } : undefined}
                className={point.ahead ? "adm-col-bar adm-col-bar--ahead" : "adm-col-bar"}
              />
              <text x={cx} y={H - 10} textAnchor="middle" className="adm-col-label">
                {point.short}
              </text>
              {index === peak && point.value > 0 && (
                <text x={cx} y={barY - 8} textAnchor="middle" className="adm-col-peak">
                  {axis(point.value)}
                </text>
              )}
              <g className="adm-tip" aria-hidden="true">
                <rect x={tipX} y={tipY} width={tipW} height={18 * (point.detail.length + 1) + 8} rx="10" />
                <text x={tipX + 12} y={tipY + 20} className="adm-tip-title">
                  {point.label}
                  {point.ahead ? " (so far)" : ""}
                </text>
                {point.detail.map((line, row) => (
                  <text key={line} x={tipX + 12} y={tipY + 38 + 18 * row}>
                    {line}
                  </text>
                ))}
              </g>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="adm-baseline" />
      </svg>
    </figure>
  );
}

/** Horizontal bars for a ranking (room types, countries): label, bar, value. */
export function RankBars({ rows, empty }: { rows: { label: string; value: number; display: string }[]; empty: string }) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  if (max === 0) return <p className="adm-muted">{empty}</p>;
  return (
    <ul className="adm-rank">
      {rows.map((row) => (
        <li key={row.label}>
          <span className="adm-rank-label">{row.label}</span>
          <span className="adm-rank-track" aria-hidden="true">
            <span style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="adm-rank-value">{row.display}</span>
        </li>
      ))}
    </ul>
  );
}
