import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";

type TargetCfg = Pick<
  CoachSessionEditConfig,
  | "targetPaceLoad"
  | "targetSplitWatts"
  | "targetSplit"
  | "targetPace"
  | "hrGuide"
  | "hrZone"
  | "rpeTarget"
  | "restRecovery"
  | "recovery"
  | "coachPacingNote"
  | "coachNote"
>;

export function restRecoveryFromConfig(c: TargetCfg): string {
  return c.restRecovery?.trim() || c.recovery?.trim() || "";
}

export function targetSplitWattsFromConfig(c: TargetCfg): string {
  return c.targetSplitWatts?.trim() || c.targetSplit?.trim() || "";
}

export function hasManualPaceLoadOverrides(c: TargetCfg): boolean {
  return Boolean(c.targetPaceLoad?.trim() || targetSplitWattsFromConfig(c));
}

export function hasManualTargetOverrides(c: TargetCfg): boolean {
  return Boolean(
    hasManualPaceLoadOverrides(c) ||
    c.hrGuide?.trim() ||
    c.hrZone?.trim() ||
    c.rpeTarget?.trim() ||
    restRecoveryFromConfig(c) ||
    c.coachPacingNote?.trim()
  );
}

/** Athlete-facing Target Pace / Load block (manual overrides only, then prescription). */
export function formatAthleteTargetPaceLoad(
  cfg: TargetCfg,
  prescription?: {
    targetPace?: string | null;
    targetSplit?: string | null;
    targetLoad?: string | null;
  } | null
): string {
  const pace = cfg.targetPaceLoad?.trim();
  const split = targetSplitWattsFromConfig(cfg);
  if (pace && split) return `${pace} · ${split}`;
  if (pace) return pace;
  if (split) return split;

  if (hasManualPaceLoadOverrides(cfg)) {
    return "See coach pacing note";
  }

  return (
    prescription?.targetPace?.trim() ||
    prescription?.targetSplit?.trim() ||
    prescription?.targetLoad?.trim() ||
    "See session prescription"
  );
}

export function resolveAthleteHrZone(
  cfg: TargetCfg,
  prescription?: { targetHRRange?: string | null; fallbackHRGuide?: string | null } | null
): string {
  if (cfg.hrGuide?.trim()) return cfg.hrGuide.trim();
  if (cfg.hrZone?.trim()) return cfg.hrZone.trim();
  return (
    prescription?.targetHRRange?.trim() ||
    prescription?.fallbackHRGuide?.trim() ||
    "Per programme prescription"
  );
}

export function resolveAthleteRpeTarget(
  cfg: TargetCfg,
  prescription?: { rpeTarget?: string | null; targetRPE?: string | null } | null
): string {
  if (cfg.rpeTarget?.trim()) return cfg.rpeTarget.trim();
  return (
    prescription?.rpeTarget?.trim() ||
    prescription?.targetRPE?.trim() ||
    "7–8"
  );
}

/** Main-set lines from reps — rest only; targets live in Target Pace / Load section. */
export function mainSetStructureLinesFromConfig(
  c: CoachSessionEditConfig,
  opts?: { includeEmbeddedTargets?: boolean }
): string[] {
  const includeTargets = opts?.includeEmbeddedTargets ?? !hasManualPaceLoadOverrides(c);
  const rest = restRecoveryFromConfig(c);

  if (c.kind === "erg_interval" && c.ergReps && c.intervalDurationMinutes) {
    const mod = c.modality === "row" ? "Row" : c.modality === "bike" ? "Bike" : "Ski";
    const lines = [`${c.ergReps}×${c.intervalDurationMinutes} min ${mod} @ threshold`];
    if (rest) lines.push(`Recovery: ${rest}`);
    if (includeTargets) {
      const split = targetSplitWattsFromConfig(c);
      if (split) lines.push(`Target split: ${split}`);
    }
    return lines;
  }
  if (c.kind === "threshold_run" && c.reps && c.repDurationMinutes) {
    const lines = [`${c.reps}×${c.repDurationMinutes} min @ threshold`];
    if (rest) lines.push(`Recovery: ${rest}`);
    if (includeTargets) {
      const pace = c.targetPaceLoad?.trim() || c.targetPace?.trim();
      if (pace) lines.push(`Target pace: ${pace}`);
    }
    return lines;
  }
  return [];
}

function normText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Admin warning when library/generated copy still embeds old targets. */
export function detectManualTargetStaleWarning(
  session: { prescription?: { objective?: string; mainSet?: string[]; targetPace?: string | null; targetSplit?: string | null } | null },
  c: CoachSessionEditConfig
): string | null {
  const manualPace = c.targetPaceLoad?.trim();
  const manualSplit = targetSplitWattsFromConfig(c);
  const libPace = session.prescription?.targetPace?.trim();
  const libSplit = session.prescription?.targetSplit?.trim();
  const blob = normText(
    [c.objective, ...(c.mainSetLines ?? []), session.prescription?.objective, ...(session.prescription?.mainSet ?? [])]
      .filter(Boolean)
      .join(" ")
  );

  if (manualPace && libPace && normText(manualPace) !== normText(libPace) && blob.includes(normText(libPace))) {
    return "Manual target differs from generated text — update objective/main set if needed.";
  }
  if (manualSplit && libSplit && normText(manualSplit) !== normText(libSplit) && blob.includes(normText(libSplit))) {
    return "Manual target differs from generated text — update objective/main set if needed.";
  }
  return null;
}
