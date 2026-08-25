import clsx from "clsx";

type Tone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-paper text-ink-muted",
  good: "bg-green-soft text-green",
  warn: "bg-amber-soft text-amber",
  bad: "bg-red-soft text-red",
  info: "bg-navy-soft text-navy",
};

export function StatusChip({
  label,
  tone = "neutral",
  className,
  title,
}: {
  label: string;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
