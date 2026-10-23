import { visualMeta } from "../tokens";

/** Hairline trajectory. Measured points only — no interpolation fill. */
export function TrajectoryChart({
  values,
  labels,
  unit,
}: {
  values: number[];
  labels: string[];
  unit: string;
}) {
  const width = 320;
  const height = 92;
  const pad = 8;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const points = values.map((value, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="rgba(250,204,21,0.85)"
          strokeWidth="1.5"
          points={points.join(" ")}
        />
        {values.map((value, i) => {
          const x = pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1);
          const y = height - pad - ((value - min) / span) * (height - pad * 2);
          return <circle key={labels[i] ?? i} cx={x} cy={y} r="2.5" fill="#facc15" />;
        })}
      </svg>
      <figcaption className={`mt-1 flex justify-between ${visualMeta}`}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
        <span className="sr-only">{unit}</span>
      </figcaption>
    </figure>
  );
}

export function SplitStrip({
  items,
}: {
  items: Array<{ label: string; display: string; seconds: number; emphasize?: boolean }>;
}) {
  const max = Math.max(...items.map((item) => item.seconds), 1);
  const min = Math.min(...items.map((item) => item.seconds), max);
  return (
    <ol className="grid grid-cols-8 gap-1">
      {items.map((item) => {
        const height = 28 + ((item.seconds - min) / Math.max(max - min, 1)) * 44;
        return (
          <li key={item.label} className="flex flex-col items-center gap-1">
            <span
              className={`w-full rounded-sm ${item.emphasize ? "bg-yellow-400" : "bg-zinc-600"}`}
              style={{ height }}
            />
            <span className="text-[9px] uppercase tracking-wide text-zinc-400">{item.label}</span>
            <span className="text-[10px] tabular-nums text-zinc-200">{item.display}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function ModalityBar({
  slices,
}: {
  slices: Array<{ label: string; minutes: number }>;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.minutes, 0) || 1;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-sm bg-zinc-800">
        {slices.map((slice, i) => (
          <div
            key={slice.label}
            className={i % 2 === 0 ? "bg-yellow-400/80" : "bg-zinc-500"}
            style={{ width: `${(slice.minutes / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {slices.map((slice) => (
          <li key={slice.label} className="flex justify-between text-xs text-zinc-400">
            <span>{slice.label}</span>
            <span className="tabular-nums text-zinc-200">{slice.minutes} min</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IntervalTimeline({
  steps,
}: {
  steps: Array<{ kind: "work" | "rest"; label: string; target: string }>;
}) {
  return (
    <ol className="flex items-end gap-1">
      {steps.map((step, i) => (
        <li key={`${step.label}-${i}`} className="min-w-0 flex-1">
          <div
            className={`w-full rounded-sm ${step.kind === "work" ? "h-12 bg-yellow-400" : "h-5 bg-zinc-700"}`}
          />
          <p className="mt-1 truncate text-[10px] tabular-nums text-zinc-300">{step.label}</p>
          <p className="truncate text-[10px] text-zinc-500">{step.target}</p>
        </li>
      ))}
    </ol>
  );
}

export function TargetActual({
  target,
  actual,
  rpe,
}: {
  target: { label: string; value: string };
  actual: { label: string; value: string };
  rpe?: { label: string; value: string };
}) {
  const cells = [target, actual, rpe].filter(
    (cell): cell is { label: string; value: string } => Boolean(cell)
  );
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0">
          <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{cell.label}</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums tracking-tight text-white sm:text-2xl">{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ComparisonBars({
  rows,
}: {
  rows: Array<{ label: string; current: string; deltaLabel: string; improved: boolean }>;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-baseline justify-between gap-3 border-b border-zinc-800 pb-2">
          <span className="text-xs text-zinc-400">{row.label}</span>
          <span className="text-sm tabular-nums text-white">{row.current}</span>
          <span className={`text-xs tabular-nums ${row.improved ? "text-zinc-200" : "text-amber-200"}`}>
            {row.deltaLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}
