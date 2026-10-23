import { visualCard, visualCardPad, visualEyebrow } from "./tokens";

export type ProgressChartPoint = {
  label: string;
  value: number;
};

export function ProgressChartCard({
  title,
  unit,
  series,
  empty,
}: {
  title: string;
  unit?: string;
  series?: ProgressChartPoint[] | null;
  empty: string;
}) {
  const points = (series ?? []).filter((point) => Number.isFinite(point.value));
  const max = points.reduce((n, point) => Math.max(n, point.value), 0);

  return (
    <article className={`${visualCard} ${visualCardPad}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={visualEyebrow}>{title}</p>
        {unit && points.length ? <p className="text-xs text-zinc-400">{unit}</p> : null}
      </div>
      {points.length === 0 || max <= 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{empty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {points.map((point) => (
            <li key={point.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-xs text-zinc-400">{point.label}</span>
                <span className="text-sm font-semibold tabular-nums text-white">{point.value}</span>
              </div>
              <div className="h-px bg-zinc-800">
                <div
                  className="h-px bg-yellow-400/70"
                  style={{ width: `${Math.min(100, Math.max(0, (point.value / max) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
