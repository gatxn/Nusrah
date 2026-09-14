type Segment = { label: string; value: number; colorClass: string; hex: string };

const SIZE = 160;
const CENTER = SIZE / 2;
const OUTER_R = 70;
const INNER_R = 44;

function polarToCartesian(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function arcPath(startAngle: number, endAngle: number): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const [x1, y1] = polarToCartesian(startAngle, OUTER_R);
  const [x2, y2] = polarToCartesian(endAngle, OUTER_R);
  const [x3, y3] = polarToCartesian(endAngle, INNER_R);
  const [x4, y4] = polarToCartesian(startAngle, INNER_R);
  return [
    `M ${x1} ${y1}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

export default function DonutChart({ segments, centerLabel }: { segments: Segment[]; centerLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let angle = 0;
  const arcs = segments.map((s) => {
    const span = total > 0 ? (s.value / total) * 360 : 0;
    const path = span > 0 ? arcPath(angle, angle + span) : null;
    angle += span;
    return { ...s, path };
  });

  const verifiedPercent = total > 0 ? Math.round(((segments[0]?.value ?? 0) / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-40 w-40">
          {total === 0 ? (
            <circle cx={CENTER} cy={CENTER} r={(OUTER_R + INNER_R) / 2} fill="none" stroke="#e5e7eb" strokeWidth={OUTER_R - INNER_R} />
          ) : (
            arcs.map((a) => (a.path ? <path key={a.label} d={a.path} className={a.colorClass} /> : null))
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-navy">{verifiedPercent}%</span>
          <span className="text-[10px] text-neutral-500">{centerLabel}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
            <span className="text-neutral-600">{s.label}</span>
            <span className="font-semibold text-navy">{s.value}</span>
            <span className="text-neutral-400">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
