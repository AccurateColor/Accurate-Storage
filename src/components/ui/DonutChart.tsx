/** Simple ring/donut chart via stroke-dasharray segments — see Sparkline.tsx's comment on why no chart library. */
export function DonutChart({
  segments,
  size = 160,
  strokeWidth = 22,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ arcs: (typeof segments[number] & { dasharray: string; dashoffset: number })[]; offset: number }>(
      (acc, s) => {
        const dash = (s.value / total) * circumference;
        acc.arcs.push({ ...s, dasharray: `${dash} ${circumference - dash}`, dashoffset: -acc.offset });
        return { arcs: acc.arcs, offset: acc.offset + dash };
      },
      { arcs: [], offset: 0 }
    ).arcs;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold text-ink">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-ink-muted">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
