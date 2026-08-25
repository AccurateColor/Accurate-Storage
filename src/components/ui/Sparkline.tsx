/**
 * Tiny inline-SVG trend line for a stat card. Deliberately dependency-free
 * (no chart library) — this app's whole "No ORM... plain queries" minimal-
 * dependency philosophy (see amazing-spaces-app/README.md) extends to the
 * UI layer too: a sparkline is a handful of SVG points, not a reason to
 * pull in a charting package.
 */
export function Sparkline({
  data,
  color = "var(--color-pink)",
  fill = true,
  width = 120,
  height = 40,
}: {
  data: number[];
  color?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && <path d={areaPath} fill={color} opacity={0.12} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
