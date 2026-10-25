/**
 * Coach-facing Programming Anchors — active Performance Profile values only.
 * Never invents or silently estimates missing metrics.
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import {
  formatDuration,
  formatPacePerKm,
  formatSplitPer500,
  formatWatts,
} from "@/app/lib/hyroxBenchmarkMath";
import {
  STALE_BENCHMARK_DAYS,
  benchmarkAgeDays,
  type BenchmarkSource,
} from "@/app/lib/hyroxBenchmarkTypes";

export type ProgrammingAnchorKey =
  | "threshold"
  | "run5k"
  | "run10k"
  | "hyroxRun"
  | "ski2k"
  | "row2k"
  | "ftp";

export type ProgrammingAnchorGroupId = "running" | "erg" | "bike";

export type ProgrammingAnchorFreshness = "current" | "stale" | "not_set";

export type ProgrammingAnchorItem = {
  key: ProgrammingAnchorKey;
  group: ProgrammingAnchorGroupId;
  /** Short coach label e.g. Threshold, 5K */
  label: string;
  /** Primary display value or null when not set */
  primary: string | null;
  /** Secondary line e.g. split /500m — null when unused */
  secondary: string | null;
  source: BenchmarkSource | null;
  /** Coach-facing source label */
  sourceLabel: string | null;
  resultDate: string | null;
  /** Compact date e.g. 25 Oct */
  dateLabel: string | null;
  freshness: ProgrammingAnchorFreshness;
  ageDays: number | null;
};

export type ProgrammingAnchorGroup = {
  id: ProgrammingAnchorGroupId;
  label: string;
  items: ProgrammingAnchorItem[];
};

export type ProgrammingAnchorsSummary = {
  groups: ProgrammingAnchorGroup[];
  /** Flat list in display order */
  items: ProgrammingAnchorItem[];
  missingCount: number;
  staleCount: number;
  setCount: number;
};

/** Coach-facing labels for stored BenchmarkSource values. */
export function programmingAnchorSourceLabel(source: BenchmarkSource): string {
  switch (source) {
    case "lab_test":
      return "Lab tested";
    case "coach_entered":
      return "Coach estimate";
    case "performance_test":
      return "Benchmark test";
    case "onboarding_test":
      return "Onboarding assessment";
    case "race_result":
      return "Race result";
    case "athlete_submitted":
      return "Athlete submitted";
    case "imported":
      return "Imported";
    default:
      return "Unknown source";
  }
}

/** Compact date for dense coach UI (UTC calendar day of result_date). */
export function formatProgrammingAnchorDate(resultDate: string | null | undefined): string | null {
  if (!resultDate || !/^\d{4}-\d{2}-\d{2}/.test(resultDate)) return null;
  const d = new Date(`${resultDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function freshnessFor(
  resultDate: string | null,
  today = new Date()
): { freshness: ProgrammingAnchorFreshness; ageDays: number | null } {
  if (!resultDate) return { freshness: "not_set", ageDays: null };
  const ageDays = benchmarkAgeDays(resultDate, today);
  if (ageDays == null) return { freshness: "current", ageDays: null };
  if (ageDays >= STALE_BENCHMARK_DAYS) return { freshness: "stale", ageDays };
  return { freshness: "current", ageDays };
}

function itemFrom(args: {
  key: ProgrammingAnchorKey;
  group: ProgrammingAnchorGroupId;
  label: string;
  primary: string | null;
  secondary: string | null;
  source: BenchmarkSource | null;
  resultDate: string | null;
  today?: Date;
}): ProgrammingAnchorItem {
  const set = Boolean(args.primary);
  const { freshness, ageDays } = set
    ? freshnessFor(args.resultDate, args.today)
    : { freshness: "not_set" as const, ageDays: null };
  return {
    key: args.key,
    group: args.group,
    label: args.label,
    primary: args.primary,
    secondary: args.secondary,
    source: set ? args.source : null,
    sourceLabel: set && args.source ? programmingAnchorSourceLabel(args.source) : null,
    resultDate: set ? args.resultDate : null,
    dateLabel: set ? formatProgrammingAnchorDate(args.resultDate) : null,
    freshness,
    ageDays,
  };
}

/**
 * Build Programming Anchors from the active Performance Profile only.
 * Pending / historical / non-active rows are never selected here.
 */
export function buildProgrammingAnchorsSummary(
  profile: HyroxAthletePerformanceProfile | null | undefined,
  opts?: { today?: Date; includeRun10k?: boolean }
): ProgrammingAnchorsSummary {
  const today = opts?.today ?? new Date();
  const includeRun10k = opts?.includeRun10k !== false;
  const p = profile ?? null;

  const running: ProgrammingAnchorItem[] = [
    itemFrom({
      key: "threshold",
      group: "running",
      label: "Threshold",
      primary: p?.threshold ? formatPacePerKm(p.threshold.paceSecondsPerKm) : null,
      secondary: null,
      source: p?.threshold?.source ?? null,
      resultDate: p?.threshold?.resultDate ?? null,
      today,
    }),
    itemFrom({
      key: "run5k",
      group: "running",
      label: "5K",
      primary: p?.run5k ? formatDuration(p.run5k.resultSeconds) : null,
      secondary: p?.run5k ? formatPacePerKm(p.run5k.paceSecondsPerKm) : null,
      source: p?.run5k?.source ?? null,
      resultDate: p?.run5k?.resultDate ?? null,
      today,
    }),
  ];

  if (includeRun10k) {
    running.push(
      itemFrom({
        key: "run10k",
        group: "running",
        label: "10K",
        primary: p?.run10k ? formatDuration(p.run10k.resultSeconds) : null,
        secondary: p?.run10k ? formatPacePerKm(p.run10k.paceSecondsPerKm) : null,
        source: p?.run10k?.source ?? null,
        resultDate: p?.run10k?.resultDate ?? null,
        today,
      })
    );
  }

  running.push(
    itemFrom({
      key: "hyroxRun",
      group: "running",
      label: "HYROX run",
      primary: p?.hyroxRun ? formatPacePerKm(p.hyroxRun.paceSecondsPerKm) : null,
      secondary: null,
      source: p?.hyroxRun?.source ?? null,
      resultDate: p?.hyroxRun?.resultDate ?? null,
      today,
    })
  );

  const erg: ProgrammingAnchorItem[] = [
    itemFrom({
      key: "ski2k",
      group: "erg",
      label: "Ski 2K",
      primary: p?.ski2k ? formatDuration(p.ski2k.resultSeconds) : null,
      secondary: p?.ski2k ? formatSplitPer500(p.ski2k.splitSecondsPer500) : null,
      source: p?.ski2k?.source ?? null,
      resultDate: p?.ski2k?.resultDate ?? null,
      today,
    }),
    itemFrom({
      key: "row2k",
      group: "erg",
      label: "Row 2K",
      primary: p?.row2k ? formatDuration(p.row2k.resultSeconds) : null,
      secondary: p?.row2k ? formatSplitPer500(p.row2k.splitSecondsPer500) : null,
      source: p?.row2k?.source ?? null,
      resultDate: p?.row2k?.resultDate ?? null,
      today,
    }),
  ];

  const bike: ProgrammingAnchorItem[] = [
    itemFrom({
      key: "ftp",
      group: "bike",
      label: "FTP",
      primary: p?.ftp ? formatWatts(p.ftp.watts) : null,
      secondary: null,
      source: p?.ftp?.source ?? null,
      resultDate: p?.ftp?.resultDate ?? null,
      today,
    }),
  ];

  const groups: ProgrammingAnchorGroup[] = [
    { id: "running", label: "Running", items: running },
    { id: "erg", label: "Erg", items: erg },
    { id: "bike", label: "Bike", items: bike },
  ];
  const items = groups.flatMap((g) => g.items);
  return {
    groups,
    items,
    missingCount: items.filter((i) => i.freshness === "not_set").length,
    staleCount: items.filter((i) => i.freshness === "stale").length,
    setCount: items.filter((i) => i.freshness !== "not_set").length,
  };
}

/** Provenance line: "Coach estimate · 25 Oct" or "Not set". */
export function programmingAnchorProvenanceLine(item: ProgrammingAnchorItem): string {
  if (item.freshness === "not_set" || !item.primary) return "Not set";
  const parts = [item.sourceLabel, item.dateLabel].filter(Boolean);
  return parts.join(" · ") || "Active";
}

export type SessionPrescriptionContext = {
  kind: "threshold" | "generic";
  title: string;
  anchorLabel: string;
  anchorValue: string | null;
  anchorSourceLine: string | null;
  ruleExpression: string | null;
  suggestedTarget: string | null;
  coachFixedTarget: string | null;
  missingAnchorWarning: string | null;
};

/**
 * Session edit context for threshold / family-linked run sessions.
 * Distinguishes anchor → formula → coach fixed target. Never invents pace.
 */
export function buildSessionPrescriptionContext(args: {
  profile: HyroxAthletePerformanceProfile | null | undefined;
  sessionFamily?: {
    familyName?: string;
    stageLabel?: string;
    prescriptionPreview?: {
      slots?: Array<{
        slot: string;
        expression?: string | null;
        resolvedValue?: number | null;
        source?: string | null;
      }>;
    } | null;
  } | null;
  editConfig?: {
    kind?: string;
    targetPaceLoad?: string | null;
    targetPace?: string | null;
  } | null;
}): SessionPrescriptionContext | null {
  const family = args.sessionFamily;
  const runSlot = family?.prescriptionPreview?.slots?.find((s) => s.slot === "run");
  const isThresholdFamily = Boolean(family && runSlot);
  const isThresholdKind = args.editConfig?.kind === "threshold_run";
  if (!isThresholdFamily && !isThresholdKind) return null;

  const threshold = args.profile?.threshold ?? null;
  const anchorValue = threshold ? formatPacePerKm(threshold.paceSecondsPerKm) : null;
  const suggested =
    runSlot?.resolvedValue != null && Number.isFinite(runSlot.resolvedValue)
      ? formatPacePerKm(runSlot.resolvedValue)
      : null;
  const coachFixed =
    args.editConfig?.targetPaceLoad?.trim() ||
    args.editConfig?.targetPace?.trim() ||
    null;

  return {
    kind: "threshold",
    title: family?.familyName
      ? `${family.familyName}${family.stageLabel ? ` · ${family.stageLabel}` : ""}`
      : "Threshold session",
    anchorLabel: "Active threshold",
    anchorValue,
    anchorSourceLine: threshold
      ? [
          programmingAnchorSourceLabel(threshold.source),
          formatProgrammingAnchorDate(threshold.resultDate),
        ]
          .filter(Boolean)
          .join(" · ")
      : null,
    ruleExpression: runSlot?.expression ?? (isThresholdKind ? null : null),
    suggestedTarget: suggested,
    coachFixedTarget: coachFixed,
    missingAnchorWarning: !threshold
      ? "Threshold anchor not set. Open Performance Profile to set a coach estimate, or enter an explicit manual target."
      : null,
  };
}
