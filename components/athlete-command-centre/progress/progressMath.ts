import type {
  HyroxAnalyticsBenchmarkPoint,
  HyroxAnalyticsBenchmarkSeries,
} from "@/app/lib/hyroxAthleteAnalytics";

/** Time / pace / race clocks — lower normalized value is better. */
const LOWER_IS_BETTER = new Set([
  "run_5k",
  "run_10k",
  "threshold_pace",
  "hyrox_run_pace",
  "ski_1k",
  "ski_2k",
  "row_2k",
  "hyrox_race",
]);

export type ProgressPeriod = "4w" | "8w" | "12w" | "all";

export const PROGRESS_PERIODS: Array<{ id: ProgressPeriod; label: string; weeks: number | null }> = [
  { id: "4w", label: "4 weeks", weeks: 4 },
  { id: "8w", label: "8 weeks", weeks: 8 },
  { id: "12w", label: "12 weeks", weeks: 12 },
  { id: "all", label: "All", weeks: null },
];

export function isLowerBetter(type: string): boolean {
  return LOWER_IS_BETTER.has(type);
}

export function cutoffYmd(period: ProgressPeriod, asOfYmd: string): string | null {
  const weeks = PROGRESS_PERIODS.find((row) => row.id === period)?.weeks ?? null;
  if (weeks == null) return null;
  const base = parseYmd(asOfYmd);
  if (!base) return null;
  base.setUTCDate(base.getUTCDate() - weeks * 7);
  return toYmd(base);
}

export function filterSeriesByPeriod(
  series: HyroxAnalyticsBenchmarkSeries,
  period: ProgressPeriod,
  asOfYmd: string
): HyroxAnalyticsBenchmarkSeries {
  const cutoff = cutoffYmd(period, asOfYmd);
  if (!cutoff) return series;
  return {
    ...series,
    points: series.points.filter((point) => point.date.slice(0, 10) >= cutoff),
  };
}

export type BenchmarkDelta = {
  latest: HyroxAnalyticsBenchmarkPoint;
  previous: HyroxAnalyticsBenchmarkPoint | null;
  absolute: number | null;
  absoluteLabel: string | null;
  percentLabel: string | null;
  improved: boolean | null;
  dateRangeLabel: string;
};

export function computeBenchmarkDelta(
  series: HyroxAnalyticsBenchmarkSeries
): BenchmarkDelta | null {
  if (series.points.length === 0) return null;
  const latest = series.points[series.points.length - 1]!;
  const previous = series.points.length >= 2 ? series.points[series.points.length - 2]! : null;
  const lowerBetter = isLowerBetter(series.type);

  let absolute: number | null = null;
  let improved: boolean | null = null;
  let absoluteLabel: string | null = null;
  let percentLabel: string | null = null;

  if (previous) {
    absolute = latest.normalizedValue - previous.normalizedValue;
    improved = lowerBetter ? absolute < 0 : absolute > 0;
    absoluteLabel = formatAbsoluteDelta(series.type, absolute, lowerBetter);
    if (previous.normalizedValue !== 0) {
      const pct = Math.round((Math.abs(absolute) / Math.abs(previous.normalizedValue)) * 100);
      if (pct > 0) {
        percentLabel = improved ? `${pct}% better` : `${pct}% off previous`;
      }
    }
  }

  const first = series.points[0]!;
  const dateRangeLabel =
    series.points.length === 1
      ? formatPointDate(latest.date)
      : `${formatPointDate(first.date)} – ${formatPointDate(latest.date)}`;

  return {
    latest,
    previous,
    absolute,
    absoluteLabel,
    percentLabel,
    improved,
    dateRangeLabel,
  };
}

export type ProgressMilestone = {
  id: string;
  label: string;
  meta: string;
};

export function deriveMilestones(
  seriesList: HyroxAnalyticsBenchmarkSeries[]
): ProgressMilestone[] {
  const milestones: ProgressMilestone[] = [];
  for (const series of seriesList) {
    if (series.points.length < 2) continue;
    const delta = computeBenchmarkDelta(series);
    if (!delta?.previous || !delta.absoluteLabel || delta.improved !== true) continue;

    const best = bestPoint(series);
    const isPb = best != null && best.date === delta.latest.date;
    milestones.push({
      id: `${series.type}-${delta.latest.date}`,
      label: isPb ? `New ${series.label} PB` : `${series.label} improved`,
      meta: `${delta.absoluteLabel} · ${formatPointDate(delta.latest.date)}`,
    });
  }
  return milestones.slice(0, 4);
}

function bestPoint(series: HyroxAnalyticsBenchmarkSeries): HyroxAnalyticsBenchmarkPoint | null {
  if (series.points.length === 0) return null;
  const lowerBetter = isLowerBetter(series.type);
  return series.points.reduce((best, point) => {
    if (lowerBetter) return point.normalizedValue < best.normalizedValue ? point : best;
    return point.normalizedValue > best.normalizedValue ? point : best;
  });
}

function formatAbsoluteDelta(type: string, delta: number, lowerBetter: boolean): string {
  const mag = Math.abs(delta);
  const sign = delta === 0 ? "" : lowerBetter ? (delta < 0 ? "−" : "+") : delta > 0 ? "+" : "−";
  if (isTimeLike(type)) {
    const seconds = Math.round(mag);
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${sign}${m}:${String(s).padStart(2, "0")}`;
    }
    return `${sign}${seconds}s`;
  }
  if (type === "ftp") return `${sign}${Math.round(mag)} W`;
  if (isStrength(type)) return `${sign}${round1(mag)} kg`;
  if (type === "run_30min") return `${sign}${round1(mag)} km`;
  return `${sign}${round1(mag)}`;
}

function isTimeLike(type: string): boolean {
  return LOWER_IS_BETTER.has(type);
}

function isStrength(type: string): boolean {
  return ["squat", "deadlift", "bench", "military_press"].includes(type);
}

export function formatPointDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}`;
}

export function formatMinutes(value: number | null): string {
  if (value == null) return "—";
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(value)} min`;
}

export function formatKm(value: number | null): string {
  return value == null ? "—" : `${value} km`;
}

export function formatPct(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function parseYmd(ymd: string): Date | null {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function toYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Pick the series with the clearest real improvement signal, else richest history. */
export function pickPrimarySeries(
  seriesList: HyroxAnalyticsBenchmarkSeries[]
): HyroxAnalyticsBenchmarkSeries | null {
  if (seriesList.length === 0) return null;
  const withTrend = seriesList
    .map((series) => ({ series, delta: computeBenchmarkDelta(series) }))
    .filter((row) => row.delta?.previous != null);
  const improved = withTrend.filter((row) => row.delta?.improved === true);
  if (improved.length > 0) {
    improved.sort((a, b) => b.series.points.length - a.series.points.length);
    return improved[0]!.series;
  }
  const ranked = [...seriesList].sort((a, b) => b.points.length - a.points.length);
  return ranked[0] ?? null;
}
