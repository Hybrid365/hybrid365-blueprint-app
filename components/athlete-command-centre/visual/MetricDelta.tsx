/** Displays a caller-formatted change. Does not compute a delta. */

export function MetricDelta({
  value,
  direction,
  label,
}: {
  value: string | null | undefined;
  direction?: "up" | "down" | "flat" | null;
  label?: string;
}) {
  const shown = value?.trim() || null;
  if (!shown) return null;
  const mark = direction === "up" ? "↑" : direction === "down" ? "↓" : direction === "flat" ? "→" : "";
  return (
    <p className="text-xs text-zinc-400">
      {label ? <span className="mr-1">{label}</span> : null}
      {mark ? <span className="mr-1 text-zinc-400">{mark}</span> : null}
      <span>{shown}</span>
    </p>
  );
}
