/**
 * Coach-facing session library — curated cards for Programme Builder.
 */

import { COACH_SESSION_LIBRARY_DATA } from "@/app/lib/hyroxCoachSessionLibraryData";
import {
  enrichCoachStapleEntry,
  KIERAN_COACH_SESSIONS,
} from "@/app/lib/hyroxCoachSessionLibraryKieran";
import { HYROX_BATCH_COACH_SESSIONS } from "@/app/lib/hyroxCoachSessionLibraryHyroxBatch";
import { HYROX_MINI_COMPROMISED_COACH_SESSIONS } from "@/app/lib/hyroxCoachSessionLibraryMiniCompromised";
import { HYROX_VOLUME_BUILDER_COACH_SESSIONS } from "@/app/lib/hyroxCoachSessionLibraryVolumeBuilders";
import { HYBRID_ENGINE_COACH_SESSIONS } from "@/app/lib/hyroxCoachSessionLibraryHybridEngine";
import type {
  CoachLibraryEntry,
  LibraryCategory,
  LibraryQuickFilter,
} from "@/app/lib/hyroxCoachSessionLibraryTypes";
import { isCoachStapleEntry } from "@/app/lib/hyroxCoachSessionLibraryTypes";
import {
  shouldHideFromSmartSuggestions,
  type CoachLibraryGuardrailContext,
} from "@/app/lib/hyroxCoachSessionLibraryGuardrails";

export type {
  CoachLibraryEntry,
  CoachSessionPrescription,
  CoachSessionHyroxMetadata,
  CoachSessionLevel,
  LibraryCategory,
  LibraryQuickFilter,
  CoachSessionVolumeMeta,
} from "@/app/lib/hyroxCoachSessionLibraryTypes";

export {
  buildCoachEntry,
  categoryToSessionType,
  volumeMetaFromEntry,
  isCoachStapleEntry,
} from "@/app/lib/hyroxCoachSessionLibraryTypes";

export {
  getSessionGuardrailWarnings,
  getAdjacentSessionWarnings,
  guardrailContextFromAthlete,
  shouldHideFromSmartSuggestions,
  type CoachLibraryGuardrailContext,
  type SessionGuardrailWarning,
} from "@/app/lib/hyroxCoachSessionLibraryGuardrails";

export const COACH_SESSION_LIBRARY: CoachLibraryEntry[] = [
  ...COACH_SESSION_LIBRARY_DATA.map(enrichCoachStapleEntry),
  ...KIERAN_COACH_SESSIONS,
  ...HYROX_BATCH_COACH_SESSIONS,
  ...HYROX_MINI_COMPROMISED_COACH_SESSIONS,
  ...HYROX_VOLUME_BUILDER_COACH_SESSIONS,
  ...HYBRID_ENGINE_COACH_SESSIONS,
];

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  all: "All",
  coach_staples: "Hybrid365 Coach Staples",
  run_development: "Running Development",
  threshold_runs: "Threshold Runs",
  tempo_aerobic: "Tempo / Aerobic Quality",
  hyrox_compromised: "Hyrox Compromised",
  hyrox_volume_builders: "HYROX Volume Builders",
  hybrid_engine: "Hybrid Engine",
  erg_intervals: "ERG Intervals",
  easy_erg: "Easy Bike / Ski / Row",
  strength_endurance: "Strength Endurance",
  station_emom: "Station EMOMs",
  upper_grip: "Upper / Grip",
  testing: "Testing",
  race_week: "Race Week",
};

export const LIBRARY_QUICK_FILTER_LABELS: Record<LibraryQuickFilter, string> = {
  staples: "Staples",
  coach_staples: "Coach Staples",
  kieran_sessions: "Kieran Sessions",
  easy: "Easy",
  hard: "Hard",
  threshold: "Threshold",
  tempo: "Tempo",
  strength: "Strength",
  hyrox: "Hyrox",
  volume_builders: "Volume Builders",
  hybrid_engine: "Hybrid Engine",
  add_ons: "Add-Ons",
  testing: "Testing",
  race_week: "Race Week",
  station_overload: "Station Overload",
  leg_endurance: "Leg Endurance",
  high_fatigue: "High Fatigue",
  low_fatigue: "Low Fatigue",
  moderate_fatigue: "Moderate Fatigue",
  level_1: "Level 1",
  level_2: "Level 2",
  advanced_level: "Advanced Level",
};

const QUICK_FILTERS: LibraryQuickFilter[] = [
  "coach_staples",
  "kieran_sessions",
  "staples",
  "easy",
  "hard",
  "threshold",
  "tempo",
  "strength",
  "hyrox",
  "volume_builders",
  "hybrid_engine",
  "low_fatigue",
  "moderate_fatigue",
  "high_fatigue",
  "level_1",
  "level_2",
  "advanced_level",
  "add_ons",
  "testing",
  "race_week",
  "station_overload",
  "leg_endurance",
];

function matchesQuickFilter(entry: CoachLibraryEntry, filter: LibraryQuickFilter): boolean {
  switch (filter) {
    case "coach_staples":
      return isCoachStapleEntry(entry);
    case "kieran_sessions":
      return (
        entry.source === "Kieran personal session" || entry.tags.includes("kieran-session")
      );
    case "staples":
      return entry.isStaple === true || entry.tags.includes("hybrid365-staple");
    case "easy":
      return entry.hardEasy === "easy";
    case "hard":
      return entry.hardDay || entry.hardEasy === "hard";
    case "threshold":
      return (entry.thresholdMinutes ?? 0) > 0 || entry.tags.includes("threshold");
    case "tempo":
      return entry.category === "tempo_aerobic" || entry.tags.includes("tempo");
    case "strength":
      return (
        entry.category === "strength_endurance" ||
        entry.impactType === "strength" ||
        entry.tags.includes("strength")
      );
    case "hyrox":
      return (
        entry.category === "hyrox_compromised" ||
        entry.category === "hyrox_volume_builders" ||
        entry.tags.includes("compromised") ||
        entry.tags.includes("hyrox") ||
        Boolean(entry.hyroxMetadata)
      );
    case "volume_builders":
      return (
        entry.category === "hyrox_volume_builders" ||
        entry.tags.includes("hyrox_volume_builder")
      );
    case "hybrid_engine":
      return (
        entry.category === "hybrid_engine" ||
        entry.tags.includes("hybrid_engine") ||
        entry.category === "erg_intervals" ||
        entry.category === "easy_erg"
      );
    case "station_overload":
      return (
        entry.tags.includes("station_overload") ||
        entry.hyroxMetadata?.sessionType === "station_overload" ||
        entry.intensityType === "station_overload"
      );
    case "leg_endurance":
      return (
        entry.tags.includes("leg_endurance") ||
        entry.tags.includes("hyrox_leg_endurance_non_running") ||
        entry.hyroxMetadata?.primaryCategory === "leg_endurance" ||
        entry.hyroxMetadata?.primaryCategory === "hyrox_leg_endurance"
      );
    case "high_fatigue":
      return (
        entry.sessionStress === "very_high" ||
        entry.tags.includes("high_fatigue_hyrox_key_session") ||
        entry.tags.includes("very_high_stress") ||
        entry.hyroxMetadata?.fatigueCost === "very_high" ||
        entry.hyroxMetadata?.fatigueCost === "high" ||
        entry.programmingStandards?.estimatedFatigueCost === "high" ||
        entry.programmingStandards?.estimatedFatigueCost === "very_high"
      );
    case "low_fatigue":
      return (
        entry.programmingStandards?.estimatedFatigueCost === "low" ||
        entry.hardEasy === "easy" ||
        entry.tags.includes("recovery")
      );
    case "moderate_fatigue":
      return (
        entry.programmingStandards?.estimatedFatigueCost === "moderate" ||
        entry.sessionStress === "moderate"
      );
    case "level_1":
      return entry.progressionLevel === "level_1";
    case "level_2":
      return entry.progressionLevel === "level_2";
    case "advanced_level":
      return (
        entry.progressionLevel === "advanced" ||
        entry.progressionLevel === "level_3" ||
        entry.level === "advanced" ||
        entry.level === "pro"
      );
    case "add_ons":
      return entry.isOptionalAddOn === true;
    case "testing":
      return entry.category === "testing";
    case "race_week":
      return entry.category === "race_week";
    default:
      return true;
  }
}

function matchesEquipment(
  entry: CoachLibraryEntry,
  available: Record<string, boolean> | undefined
): boolean {
  if (!available) return true;
  const required = entry.equipmentRequired.map((e) => e.toLowerCase());
  if (required.some((r) => r.includes("track") || r.includes("treadmill"))) {
    if (available.track || available.treadmill) return true;
  }
  if (required.some((r) => r.includes("ski"))) {
    if (available.skiErg) return true;
  }
  if (required.some((r) => r.includes("row"))) {
    if (available.rowErg) return true;
  }
  if (required.some((r) => r.includes("bike"))) {
    if (available.bike) return true;
  }
  if (required.some((r) => r.includes("sled"))) {
    if (available.sled) return true;
  }
  if (required.some((r) => r.includes("wall ball"))) {
    if (available.wallBalls) return true;
  }
  if (required.some((r) => r.includes("gym") || r.includes("db"))) {
    if (available.fullGym) return true;
  }
  if (required.length === 0 || required.every((r) => r.includes("floor") || r.includes("running"))) {
    return true;
  }
  return required.some((r) => {
    if (r.includes("track") || r.includes("run")) return available.track || available.treadmill;
    return false;
  });
}

export function filterCoachLibrary(
  category: LibraryCategory,
  query: string,
  options?: {
    quickFilter?: LibraryQuickFilter | null;
    equipmentAvailable?: Record<string, boolean>;
    /** When set without adminManualSelection, hides sessions unsuitable for athlete context. */
    guardrailContext?: CoachLibraryGuardrailContext;
  }
): CoachLibraryEntry[] {
  let list =
    category === "all"
      ? COACH_SESSION_LIBRARY
      : category === "coach_staples"
        ? COACH_SESSION_LIBRARY.filter((s) => isCoachStapleEntry(s))
        : COACH_SESSION_LIBRARY.filter((s) => s.category === category);

  if (options?.quickFilter) {
    list = list.filter((s) => matchesQuickFilter(s, options.quickFilter!));
  }

  if (options?.equipmentAvailable) {
    list = list.filter((s) => matchesEquipment(s, options.equipmentAvailable));
  }

  // Smart-suggestion guardrails — admin manual library shows all entries; generation can pass context.
  if (options?.guardrailContext && !options.guardrailContext.adminManualSelection) {
    list = list.filter((s) => !shouldHideFromSmartSuggestions(s, options.guardrailContext!));
  }

  if (query.trim()) {
    const q = query.toLowerCase().replace(/_/g, " ");
    list = list.filter((s) => {
      const meta = s.hyroxMetadata;
      const std = s.programmingStandards;
      const haystack = [
        s.name,
        s.abbrev,
        s.subcategory,
        ...s.tags,
        ...s.equipment,
        s.prescription.objective,
        s.prescription.coachNote,
        s.progressionFamily,
        s.progressionLevel,
        std?.purpose,
        std?.primaryAdaptation,
        std?.secondaryAdaptation,
        std?.estimatedFatigueCost,
        ...(std?.trainingPhase ?? []),
        ...(std?.suitableAthleteLevel ?? []),
        ...(std?.equipmentRequired ?? []),
        meta?.primaryCategory,
        meta?.secondaryCategory,
        meta?.sessionType,
        ...(meta?.trainingGoals ?? []),
        ...(meta?.weaknessTargets ?? []),
        ...(meta?.stationFocus ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/_/g, " ");
      return haystack.includes(q);
    });
  }

  return list;
}

export function getCoachLibraryEntry(id: string): CoachLibraryEntry | undefined {
  return COACH_SESSION_LIBRARY.find(
    (e) => e.id === id || e.sessionLibraryId === id
  );
}

export { QUICK_FILTERS as COACH_LIBRARY_QUICK_FILTERS };
