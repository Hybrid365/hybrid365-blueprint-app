/**
 * Custom “Build from scratch” session helpers for the 1-1 coach programme builder.
 *
 * Admin/editor structure only. Compiled output is the existing athlete-readable
 * warmup / mainSet / cooldown string arrays. Optional `customParts` on editConfig
 * is additive JSON — old drafts without it continue to work.
 */

export const CUSTOM_PART_TYPES = [
  "run",
  "ski",
  "row",
  "bike",
  "assault_bike",
  "sled_push",
  "sled_pull",
  "bbj",
  "farmers_carry",
  "sandbag_lunges",
  "wall_balls",
  "strength",
  "hyrox_stations",
  "emom",
  "amrap",
  "for_time",
  "recovery",
  "custom",
] as const;

export type CoachCustomPartType = (typeof CUSTOM_PART_TYPES)[number];

export const CUSTOM_PART_TYPE_LABELS: Record<CoachCustomPartType, string> = {
  run: "Run",
  ski: "Ski",
  row: "Row",
  bike: "Bike",
  assault_bike: "Assault Bike",
  sled_push: "Sled Push",
  sled_pull: "Sled Pull",
  bbj: "Burpee Broad Jump",
  farmers_carry: "Farmers Carry",
  sandbag_lunges: "Sandbag Lunges",
  wall_balls: "Wall Balls",
  strength: "Strength",
  hyrox_stations: "HYROX Stations",
  emom: "EMOM",
  amrap: "AMRAP",
  for_time: "For Time",
  recovery: "Recovery",
  custom: "Custom",
};

export type CoachCustomSessionPart = {
  id: string;
  type: CoachCustomPartType;
  title: string;
  instructions: string;
  sets?: string;
  reps?: string;
  rounds?: string;
  duration?: string;
  distance?: string;
  targetPace?: string;
  targetSplit?: string;
  watts?: string;
  hr?: string;
  rpe?: string;
  load?: string;
  rest?: string;
  notes?: string;
};

export type ScratchFocusOption = {
  id: string;
  label: string;
  /** Maps to an existing library category — not a new stored enum. */
  libraryCategory:
    | "run_development"
    | "hyrox_compromised"
    | "strength_endurance"
    | "easy_erg"
    | "hybrid_engine"
    | "station_emom"
    | "testing";
};

export const SCRATCH_FOCUS_OPTIONS: ScratchFocusOption[] = [
  { id: "running", label: "Running", libraryCategory: "run_development" },
  { id: "hyrox", label: "HYROX", libraryCategory: "hyrox_compromised" },
  { id: "strength", label: "Strength", libraryCategory: "strength_endurance" },
  { id: "ski", label: "Ski", libraryCategory: "easy_erg" },
  { id: "row", label: "Row", libraryCategory: "easy_erg" },
  { id: "bike", label: "Bike", libraryCategory: "easy_erg" },
  { id: "mixed", label: "Mixed / Hybrid", libraryCategory: "hybrid_engine" },
  { id: "recovery", label: "Recovery / Technique", libraryCategory: "station_emom" },
  { id: "testing", label: "Testing", libraryCategory: "testing" },
];

export const CUSTOM_PART_FIELD_KEYS = [
  "sets",
  "reps",
  "rounds",
  "duration",
  "distance",
  "targetPace",
  "targetSplit",
  "watts",
  "hr",
  "rpe",
  "load",
  "rest",
  "notes",
] as const;

export type CustomPartFieldKey = (typeof CUSTOM_PART_FIELD_KEYS)[number];

const FIELDS_BY_TYPE: Record<CoachCustomPartType, CustomPartFieldKey[]> = {
  run: ["distance", "duration", "sets", "reps", "targetPace", "rest", "hr", "rpe", "notes"],
  ski: ["distance", "duration", "sets", "targetSplit", "watts", "rest", "hr", "rpe", "notes"],
  row: ["distance", "duration", "sets", "targetSplit", "watts", "rest", "hr", "rpe", "notes"],
  bike: ["duration", "sets", "watts", "rest", "hr", "rpe", "notes"],
  assault_bike: ["duration", "sets", "watts", "rest", "hr", "rpe", "notes"],
  sled_push: ["distance", "rounds", "sets", "load", "rest", "notes"],
  sled_pull: ["distance", "rounds", "sets", "load", "rest", "notes"],
  bbj: ["distance", "rounds", "sets", "reps", "rest", "rpe", "notes"],
  farmers_carry: ["distance", "rounds", "load", "rest", "notes"],
  sandbag_lunges: ["distance", "rounds", "load", "rest", "notes"],
  wall_balls: ["reps", "rounds", "sets", "load", "rest", "notes"],
  strength: ["sets", "reps", "load", "rest", "notes"],
  hyrox_stations: ["rounds", "distance", "reps", "load", "rest", "notes"],
  emom: ["duration", "notes"],
  amrap: ["duration", "notes"],
  for_time: ["duration", "notes"],
  recovery: ["duration", "notes"],
  custom: ["notes"],
};

export function fieldsForCustomPartType(type: CoachCustomPartType): CustomPartFieldKey[] {
  return FIELDS_BY_TYPE[type];
}

export function newCustomPartId(): string {
  return `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyCustomPart(type: CoachCustomPartType = "custom"): CoachCustomSessionPart {
  return {
    id: newCustomPartId(),
    type,
    title: CUSTOM_PART_TYPE_LABELS[type],
    instructions: "",
  };
}

function formatWorkLine(part: CoachCustomSessionPart): string | null {
  const qty: string[] = [];
  if (part.sets?.trim() && (part.reps?.trim() || part.duration?.trim() || part.distance?.trim())) {
    const dose = part.reps?.trim() || part.duration?.trim() || part.distance?.trim() || "";
    qty.push(`${part.sets.trim()} × ${dose}`);
  } else if (part.rounds?.trim() && (part.reps?.trim() || part.distance?.trim() || part.duration?.trim())) {
    const dose = part.reps?.trim() || part.distance?.trim() || part.duration?.trim() || "";
    qty.push(`${part.rounds.trim()} rounds × ${dose}`);
  } else {
    if (part.sets?.trim()) qty.push(`${part.sets.trim()} sets`);
    if (part.rounds?.trim()) qty.push(`${part.rounds.trim()} rounds`);
    if (part.reps?.trim()) qty.push(part.reps.trim());
    if (part.distance?.trim()) qty.push(part.distance.trim());
    if (part.duration?.trim()) qty.push(part.duration.trim());
  }

  const targets: string[] = [];
  if (part.targetPace?.trim()) targets.push(part.targetPace.trim());
  if (part.targetSplit?.trim()) targets.push(part.targetSplit.trim());
  if (part.watts?.trim()) targets.push(part.watts.trim());
  if (part.load?.trim()) targets.push(part.load.trim());
  if (part.rpe?.trim()) targets.push(`RPE ${part.rpe.trim().replace(/^rpe\s+/i, "")}`);
  if (part.hr?.trim()) targets.push(part.hr.trim());

  if (!qty.length && !targets.length) return null;
  const head = qty.join(" · ");
  if (head && targets.length) return `${head} @ ${targets.join(" · ")}`;
  return head || targets.join(" · ");
}

/** Compile structured parts into athlete-readable `Part N — Title` main-set lines. */
export function compileCustomPartsToMainSet(parts: CoachCustomSessionPart[]): string[] {
  const lines: string[] = [];
  parts.forEach((part, index) => {
    const title = part.title.trim() || CUSTOM_PART_TYPE_LABELS[part.type];
    lines.push(`Part ${index + 1} — ${title}`);
    const work = formatWorkLine(part);
    if (work) lines.push(work);
    part.instructions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(l));
    const rest = part.rest?.trim();
    if (rest) {
      lines.push(/recover|rest|easy/i.test(rest) ? rest : `${rest} recovery`);
    }
    const notes = part.notes?.trim();
    if (notes) lines.push(notes);
  });
  return lines;
}

export function sanitiseInstructionLines(lines: string[]): string[] {
  return lines.map((l) => l.trim()).filter(Boolean);
}
