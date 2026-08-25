/** Simple vertical bar chart — see Sparkline.tsx's comment on why no chart library. */
export function BarChart({
  data,
  color = "var(--color-pink)",
  height = 200,
  formatValue = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((max / ySteps) * i));

  return (
    <div className="flex gap-3" style={{ height }}>
      <div className="flex flex-col justify-between py-1 text-right text-[11px] text-ink-faint">
        {yLabels
          .slice()
          .reverse()
          .map((v) => (
            <span key={v}>{formatValue(v)}</span>
          ))}
      </div>
      <div className="flex flex-1 items-end gap-[3px] border-l border-line pl-2">
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0);
          const showLabel = data.length <= 10 || i % Math.ceil(data.length / 10) === 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
              <div
                className="w-full rounded-t"
                style={{ height: `${pct}%`, background: color, minHeight: d.value > 0 ? 2 : 0 }}
                title={`${d.label}: ${formatValue(d.value)}`}
              />
              <span className="text-[10px] text-ink-faint" style={{ visibility: showLabel ? "visible" : "hidden" }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
