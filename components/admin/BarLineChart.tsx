const WIDTH = 700;
const HEIGHT = 260;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

function formatDayLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default function BarLineChart({
  bars,
  line,
  barLabel,
  lineLabel,
}: {
  bars: number[]; // oldest first
  line: number[]; // same length, oldest first
  barLabel: string;
  lineLabel: string;
}) {
  const n = bars.length;
  const chartW = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const maxValue = Math.max(1, ...bars, ...line);
  const slotW = chartW / n;
  const barW = Math.max(2, slotW * 0.5);

  function yFor(value: number): number {
    return PADDING_TOP + chartH - (value / maxValue) * chartH;
  }
  function xFor(i: number): number {
    return PADDING_LEFT + i * slotW + slotW / 2;
  }

  const linePoints = line.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");

  // Show roughly 6 evenly-spaced x-axis labels, oldest-to-newest.
  const labelStep = Math.max(1, Math.floor(n / 6));
  const labelIndices = Array.from({ length: n }, (_, i) => i).filter((i) => i % labelStep === 0);

  const yTicks = [0, 0.5, 1].map((f) => Math.round(maxValue * f));

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> {barLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-pink-500" /> {lineLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING_LEFT}
              x2={WIDTH - PADDING_RIGHT}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#f1f1f1"
              strokeWidth={1}
            />
            <text x={0} y={yFor(t) + 3} className="fill-neutral-400 text-[9px]">
              {t}
            </text>
          </g>
        ))}

        {bars.map((v, i) => (
          <rect
            key={i}
            x={xFor(i) - barW / 2}
            y={yFor(v)}
            width={barW}
            height={Math.max(0, yFor(0) - yFor(v))}
            className="fill-primary/70"
            rx={1}
          />
        ))}

        <polyline points={linePoints} fill="none" stroke="#ec4899" strokeWidth={2} />
        {line.map((v, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(v)} r={2.5} fill="#ec4899" />
        ))}

        {labelIndices.map((i) => (
          <text
            key={i}
            x={xFor(i)}
            y={HEIGHT - PADDING_BOTTOM + 16}
            textAnchor="middle"
            className="fill-neutral-400 text-[9px]"
          >
            {formatDayLabel(n - 1 - i)}
          </text>
        ))}
      </svg>
    </div>
  );
}
