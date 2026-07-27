/**
 * Programme Builder guidance chips — advisory only; coach remains in control.
 */

import type { CoachLibraryEntry } from "@/app/lib/hyroxCoachSessionLibraryTypes";
import { getProgressionFamily } from "./progressionFamilies";
import type {
  HyroxCoachPerformanceProfile,
  ProgrammingBuilderHint,
  ProgrammingTrainingPhase,
} from "./types";

export type BuilderGuidanceContext = {
  /** Optional coach-assigned profile (not auto-generated). */
  performanceProfile?: HyroxCoachPerformanceProfile | null;
  /** Current block / week phase label if known. */
  trainingPhase?: ProgrammingTrainingPhase | string | null;
};

function hasProgressionLink(entry: CoachLibraryEntry): boolean {
  return Boolean(
    entry.recommendedProgression?.trim() ||
      entry.progressionOptions?.length ||
      entry.prescription.progression?.trim()
  );
}

function hasRegressionLink(entry: CoachLibraryEntry): boolean {
  return Boolean(
    entry.recommendedRegression?.trim() ||
      entry.regressionOptions?.length ||
      entry.prescription.regression?.trim()
  );
}

function matchesLimiter(
  entry: CoachLibraryEntry,
  profile: HyroxCoachPerformanceProfile | null | undefined
): boolean {
  if (!profile) return false;
  const limiters = [profile.primaryLimiter, profile.supportingLimiter]
    .filter(Boolean)
    .map((s) => s!.toLowerCase());
  if (!limiters.length) return false;

  const families = profile.recommendedSessionFamilies.map((f) => f.toLowerCase());
  if (entry.progressionFamily && families.includes(entry.progressionFamily.toLowerCase())) {
    return true;
  }

  const hay = [
    entry.name,
    entry.subcategory,
    ...entry.tags,
    ...(entry.bestFor ?? []),
    ...(entry.hyroxMetadata?.weaknessTargets ?? []),
    ...(entry.programmingStandards?.primaryAdaptation
      ? [entry.programmingStandards.primaryAdaptation]
      : []),
  ]
    .join(" ")
    .toLowerCase();

  return limiters.some((l) => hay.includes(l.replace(/_/g, " ")) || hay.includes(l));
}

function recommendedForPhase(
  entry: CoachLibraryEntry,
  phase: string | null | undefined
): boolean {
  if (!phase) return false;
  const p = phase.toLowerCase();
  const phases = [
    ...(entry.programmingStandards?.trainingPhase ?? []),
    ...(entry.hyroxMetadata?.bestTrainingPhase ?? []),
  ].map((x) => x.toLowerCase());
  return phases.some((x) => x.includes(p) || p.includes(x));
}

/** Derive advisory chips for a library card in Programme Builder. */
export function deriveProgrammingBuilderHints(
  entry: CoachLibraryEntry,
  ctx?: BuilderGuidanceContext
): ProgrammingBuilderHint[] {
  const hints: ProgrammingBuilderHint[] = [];

  if (entry.category === "hyrox_volume_builders" || entry.tags.includes("hyrox_volume_builder")) {
    hints.push({
      kind: "volume_builder",
      label: "Volume builder",
      tone: "info",
    });
  }

  if (hasProgressionLink(entry) || getProgressionFamily(entry.progressionFamily)) {
    hints.push({
      kind: "progression_available",
      label: "Progression available",
      tone: "positive",
    });
  }

  if (hasRegressionLink(entry)) {
    hints.push({
      kind: "regression_available",
      label: "Regression available",
      tone: "neutral",
    });
  }

  if (matchesLimiter(entry, ctx?.performanceProfile)) {
    hints.push({
      kind: "suitable_for_limiter",
      label: "Suitable for athlete's limiter",
      tone: "positive",
    });
  }

  if (recommendedForPhase(entry, ctx?.trainingPhase)) {
    hints.push({
      kind: "recommended_this_phase",
      label: "Recommended this phase",
      tone: "info",
    });
  }

  const fatigue =
    entry.programmingStandards?.estimatedFatigueCost ??
    entry.hyroxMetadata?.fatigueCost ??
    (entry.sessionStress === "very_high" ? "very_high" : entry.hardDay ? "high" : null);

  if (fatigue === "high" || fatigue === "very_high") {
    hints.push({
      kind: "high_fatigue",
      label: fatigue === "very_high" ? "Very high fatigue" : "High fatigue",
      tone: "caution",
    });
  }

  const pairsThreshold =
    entry.tags.includes("pairs_with_threshold") ||
    entry.bestFor.some((b) => b.toLowerCase().includes("pairs_with_threshold")) ||
    (entry.category === "hyrox_volume_builders" &&
      entry.programmingStandards?.suggestedSessionPlacement.some((p) =>
        p.toLowerCase().includes("threshold")
      ));

  if (pairsThreshold) {
    hints.push({
      kind: "pairs_well_with_threshold",
      label: "Pairs well with threshold",
      tone: "info",
    });
  }

  if (
    entry.tags.includes("technical_builder") ||
    entry.subcategory.toLowerCase().includes("technical")
  ) {
    hints.push({
      kind: "technical_builder",
      label: "Technical builder",
      tone: "neutral",
    });
  }

  // Keep the card scannable — max 3 high-value chips.
  return hints.slice(0, 3);
}
