import { chartSize, land, latTicks, lonTicks, places, scale } from "./alasStrait";
import styles from "./Chart.module.css";

const { width: W, height: H } = chartSize;
const PAD = 16;

const [mx, my] = places.mocean;
const [px, py] = places.potoTano;
const [kx, ky] = places.kayangan;

/** Routes drawn on the chart (chart units). The road is schematic: it only joins the two places. */
const ferryRoute = `M${kx + 6},${ky + 4} C${kx + 110},${ky + 18} ${px - 120},${py - 80} ${px - 8},${py - 4}`;
const roadRoute = `M${px},${py} C${px + 24},${py + 66} ${px - 46},${py + 116} ${px - 92},${py + 176} S${mx + 20},${my - 26} ${mx},${my}`;
const airportRoute = `M${px},${py} C${px + 140},${py + 30} ${px + 330},${py - 6} ${W - 44},${py - 22}`;

/** Alternating black and white bars along the border, one per minute of arc. */
function minuteBars(start: number, step: number, length: number) {
  const bars: { from: number; to: number }[] = [];
  let index = 0;
  for (let at = start - step; at < length; at += step, index++) {
    if (index % 2 === 0) continue;
    const from = Math.max(0, at);
    const to = Math.min(length, at + step);
    if (to > from) bars.push({ from, to });
  }
  return bars;
}

const lonBars = minuteBars(scale.lonMinuteStart, scale.pxPerMinuteLon, W);
const latBars = minuteBars(scale.latMinuteStart, scale.pxPerMinuteLat, H);
const fiveKm = scale.pxPerKm * 5;

/** A chart mark that links to its note below the chart. */
function NoteMark({ n, x, y, label }: { n: number; x: number; y: number; label: string }) {
  return (
    <a href={`#note-${n}`} className={styles.mark} aria-label={`Note ${n}: ${label}`}>
      <circle cx={x} cy={y} r={14} />
      <text x={x} y={y} dy="0.36em">
        {n}
      </text>
    </a>
  );
}

/** Compass rose: true north only (no variation is given for this water). */
function CompassRose({ x, y, r }: { x: number; y: number; r: number }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <g className={styles.rose} transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r={r} />
      <circle r={r - 12} />
      {ticks.map((deg) => {
        const long = deg % 30 === 0;
        const a = (deg * Math.PI) / 180;
        const r0 = long ? r - 12 : r - 6;
        return (
          <line
            key={deg}
            x1={Math.sin(a) * r0}
            y1={-Math.cos(a) * r0}
            x2={Math.sin(a) * r}
            y2={-Math.cos(a) * r}
          />
        );
      })}
      <path className={styles.roseNeedle} d={`M0,${-(r - 16)} L7,0 L0,${r - 16} L-7,0Z`} />
      <path className={styles.roseNorth} d={`M0,${-(r - 16)} L7,0 L-7,0Z`} />
      <text className={styles.roseN} x={0} y={-r - 10}>
        N
      </text>
    </g>
  );
}

/** Nautical chart of the Alas Strait with Mocean plotted on Pantai Moro. */
export default function Chart({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.chart} ${className ?? ""}`}
      viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-labelledby="b-chart-title b-chart-desc"
    >
      <title id="b-chart-title">Chart of the Alas Strait between Lombok and Sumbawa</title>
      <desc id="b-chart-desc">
        Mocean Beach Resort on Pantai Moro, West Sumbawa. The ferry crosses from Kayangan on Lombok to Poto Tano on
        Sumbawa; from Poto Tano it is about 30 minutes by car to the resort. Sumbawa Besar airport (SWQ) is about 2 hours
        15 minutes away by car. Northern Rights breaks in front of the resort, next to the house reef.
      </desc>

      <defs>
        <clipPath id="b-sheet">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
        <mask id="b-ferry-reveal" maskUnits="userSpaceOnUse" x={-PAD} y={-PAD} width={W + PAD * 2} height={H + PAD * 2}>
          <path className={`${styles.reveal} ${styles.revealFerry}`} d={ferryRoute} pathLength={1} />
        </mask>
        <mask id="b-road-reveal" maskUnits="userSpaceOnUse" x={-PAD} y={-PAD} width={W + PAD * 2} height={H + PAD * 2}>
          <path className={`${styles.reveal} ${styles.revealRoad}`} d={roadRoute} pathLength={1} />
          <path className={`${styles.reveal} ${styles.revealRoad}`} d={airportRoute} pathLength={1} />
        </mask>
      </defs>

      <g clipPath="url(#b-sheet)">
        <rect className={styles.water} x={0} y={0} width={W} height={H} />

        {/* Shoal tints along every coast, then the land on top. */}
        {land.map((d, i) => (
          <path key={`o${i}`} className={styles.shoalOuter} d={d} />
        ))}
        {land.map((d, i) => (
          <path key={`i${i}`} className={styles.shoalInner} d={d} />
        ))}
        {land.map((d, i) => (
          <path key={`l${i}`} className={styles.land} d={d} />
        ))}

        {/* Graticule at every 10 minutes. */}
        {lonTicks
          .filter((t) => t.label)
          .map((t) => (
            <line key={t.x} className={styles.graticule} x1={t.x} y1={0} x2={t.x} y2={H} />
          ))}
        {latTicks
          .filter((t) => t.label)
          .map((t) => (
            <line key={t.y} className={styles.graticule} x1={0} y1={t.y} x2={W} y2={t.y} />
          ))}

        <CompassRose x={560} y={762} r={78} />

        {/* Names: upright caps on land, sloping italics on the water. */}
        <text className={styles.landName} x={190} y={650} textAnchor="middle">
          LOMBOK
        </text>
        <text className={`${styles.landName} ${styles.desk}`} x={1130} y={482} textAnchor="middle">
          SUMBAWA
        </text>
        <text className={`${styles.landName} ${styles.mob}`} x={1028} y={482} textAnchor="middle">
          SUMBAWA
        </text>
        <text className={styles.waterName} x={690} y={428} textAnchor="middle">
          Selat Alas
        </text>
        <text className={styles.waterNameSmall} x={690} y={460} textAnchor="middle">
          Alas Strait
        </text>

        {/* Ferry Kayangan to Poto Tano. */}
        <path id="b-ferry" className={styles.ferry} d={ferryRoute} mask="url(#b-ferry-reveal)" />
        <text className={styles.routeLabel} dy={-12}>
          <textPath href="#b-ferry" startOffset="50%" textAnchor="middle">
            Ferry from Lombok
          </textPath>
        </text>
        <NoteMark n={5} x={(kx + px) / 2 + 6} y={(ky + py) / 2 + 30} label="Getting here" />

        {/* Roads: Poto Tano to the resort, and east towards the airport. */}
        <g mask="url(#b-road-reveal)">
          <path className={styles.road} d={roadRoute} />
          <path className={styles.road} d={airportRoute} />
        </g>
        <path className={styles.arrow} d={`M${W - 46},${py - 34} L${W - 18},${py - 23} L${W - 47},${py - 10}Z`} />
        <text className={`${styles.placeNote} ${styles.desk}`} x={W - 22} y={py - 72} textAnchor="end">
          Sumbawa Besar airport (SWQ)
        </text>
        <text className={`${styles.placeNoteSmall} ${styles.desk}`} x={W - 22} y={py - 46} textAnchor="end">
          about 2 h 15 min by car
        </text>
        <text className={styles.placeNoteSmall} x={px + 14} y={py + 108}>
          about 30 min
        </text>
        <text className={styles.placeNoteSmall} x={px + 14} y={py + 132}>
          by car
        </text>

        {/* Ports. */}
        <rect className={styles.port} x={kx - 6} y={ky - 6} width={12} height={12} />
        <text className={styles.placeName} x={kx + 16} y={ky - 22}>
          KAYANGAN
        </text>
        <rect className={styles.port} x={px - 6} y={py - 6} width={12} height={12} />
        <text className={styles.placeName} x={px + 18} y={py + 26}>
          POTO TANO
        </text>

        {/* In front of the resort: the break and the house reef. */}
        <g className={styles.breakers} aria-hidden="true">
          <path d={`M${mx - 50},${my + 8} q7,-9 14,0 t14,0 t14,0`} />
          <path d={`M${mx - 44},${my + 20} q7,-9 14,0 t14,0 t14,0`} />
        </g>
        <text className={styles.featureName} x={mx - 62} y={my + 22} textAnchor="end">
          Northern Rights
        </text>
        <NoteMark n={4} x={mx - 282} y={my + 13} label="Surf" />

        <ellipse className={styles.reef} cx={mx - 14} cy={my + 62} rx={24} ry={12} />
        <g className={styles.reefCrosses} aria-hidden="true">
          {[
            [-24, 60],
            [-12, 66],
            [-2, 58],
          ].map(([dx, dy]) => (
            <path key={`${dx}${dy}`} d={`M${mx + dx - 4},${my + dy} h8 M${mx + dx},${my + dy - 4} v8`} />
          ))}
        </g>
        <text className={styles.featureName} x={mx - 48} y={my + 76} textAnchor="end">
          House reef
        </text>
        <NoteMark n={3} x={mx - 206} y={my + 67} label="Dive" />

        {/* The resort. */}
        <circle className={styles.resortHalo} cx={mx} cy={my} r={17} />
        <circle className={styles.resortDot} cx={mx} cy={my} r={8} />
        <NoteMark n={1} x={mx + 38} y={my - 10} label="Stay" />
        <NoteMark n={2} x={mx + 70} y={my - 10} label="Eat" />
        <text className={`${styles.resortName} ${styles.desk}`} x={mx + 98} y={my - 2}>
          MOCEAN BEACH RESORT
        </text>
        <text className={`${styles.resortName} ${styles.mob}`} x={mx + 98} y={my - 2}>
          MOCEAN
        </text>
        <text className={`${styles.coastName} ${styles.desk}`} x={mx + 98} y={my + 26}>
          Pantai Moro
        </text>
        <text className={`${styles.coastName} ${styles.mob}`} x={mx + 98} y={my + 30}>
          Pantai Moro
        </text>

        {/* Scale of kilometres (along the meridian). */}
        <g className={styles.scaleBar} transform={`translate(40 ${H - 74})`} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((km) => (
            <rect
              key={km}
              className={km % 2 === 0 ? styles.scaleFill : styles.scaleEmpty}
              x={(fiveKm / 5) * km}
              y={0}
              width={fiveKm / 5}
              height={7}
            />
          ))}
          <text x={0} y={30}>
            0
          </text>
          <text x={fiveKm} y={30} textAnchor="middle">
            5 km
          </text>
        </g>
      </g>

      {/* Border: neat lines, minute bars and graticule labels. */}
      <g className={styles.border} aria-hidden="true">
        <rect className={styles.neatInner} x={0} y={0} width={W} height={H} />
        <rect className={styles.neatOuter} x={-13} y={-13} width={W + 26} height={H + 26} />
        {lonBars.map((b) => (
          <g key={b.from}>
            <rect x={b.from} y={-9} width={b.to - b.from} height={5} />
            <rect x={b.from} y={H + 4} width={b.to - b.from} height={5} />
          </g>
        ))}
        {latBars.map((b) => (
          <g key={b.from}>
            <rect x={-9} y={b.from} width={5} height={b.to - b.from} />
            <rect x={W + 4} y={b.from} width={5} height={b.to - b.from} />
          </g>
        ))}
        {lonTicks.map((t) => (
          <line key={t.x} x1={t.x} y1={0} x2={t.x} y2={t.label ? 14 : 8} />
        ))}
        {latTicks.map((t) => (
          <line key={t.y} x1={0} y1={t.y} x2={t.label ? 14 : 8} y2={t.y} />
        ))}
      </g>
      {lonTicks
        .filter((t) => t.label)
        .map((t) => (
          <text key={t.x} className={styles.tickLabel} x={t.x + 6} y={30}>
            {t.label}
          </text>
        ))}
      {latTicks
        .filter((t) => t.label)
        .map((t) => (
          <text
            key={t.y}
            className={styles.tickLabel}
            x={0}
            y={0}
            transform={`translate(27 ${t.y - 8}) rotate(-90)`}
          >
            {t.label}
          </text>
        ))}
    </svg>
  );
}
