/**
 * Coach-facing session library — curated cards for Programme Builder.
 */

import { COACH_SESSION_LIBRARY_DATA } from "@/app/lib/hyroxCoachSessionLibraryData";
import {
  enrichCoachStapleEntry,
  KIERAN_COACH_SESSIONS,
} from "@/app/lib/hyroxCoachSessionLibraryKieran";
import type {
  CoachLibraryEntry,
  LibraryCategory,
  LibraryQuickFilter,
} from "@/app/lib/hyroxCoachSessionLibraryTypes";
import { isCoachStapleEntry } from "@/app/lib/hyroxCoachSessionLibraryTypes";

export type {
  CoachLibraryEntry,
  CoachSessionPrescription,
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

export const COACH_SESSION_LIBRARY: CoachLibraryEntry[] = [
  ...COACH_SESSION_LIBRARY_DATA.map(enrichCoachStapleEntry),
  ...KIERAN_COACH_SESSIONS,
];

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  all: "All",
  coach_staples: "Hybrid365 Coach Staples",
  run_development: "Run Development",
  threshold_runs: "Threshold Runs",
  tempo_aerobic: "Tempo / Aerobic Quality",
  hyrox_compromised: "Hyrox Compromised",
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
  add_ons: "Add-Ons",
  testing: "Testing",
  race_week: "Race Week",
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
  "add_ons",
  "testing",
  "race_week",
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
      return entry.category === "hyrox_compromised" || entry.tags.includes("compromised");
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

  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.abbrev.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q)) ||
        s.subcategory.toLowerCase().includes(q) ||
        s.equipment.some((e) => e.toLowerCase().includes(q))
    );
  }

  return list;
}

export function getCoachLibraryEntry(id: string): CoachLibraryEntry | undefined {
  return COACH_SESSION_LIBRARY.find(
    (e) => e.id === id || e.sessionLibraryId === id
  );
}

export { QUICK_FILTERS as COACH_LIBRARY_QUICK_FILTERS };
