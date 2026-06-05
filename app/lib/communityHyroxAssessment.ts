/** Paid community HYROX track — assessment types, options and validation (Phase 1). */

export type CommunityTrainingTrack = "hybrid_performance" | "hyrox";

export type HyroxRaceBooked = "yes" | "no" | "not_yet_but_planning";

export type HyroxCategory = "open" | "pro" | "doubles" | "relay" | "unsure";

export type HyroxDivision = "mens" | "womens" | "mixed" | "unsure";

export type HyroxRacePriority =
  | "completion"
  | "improve_time"
  | "podium_age_group"
  | "qualify_elite"
  | "unsure";

export type SledPushPullExperience = "none" | "limited" | "moderate" | "confident";

export type HyroxStationWeakness =
  | "running_between_stations"
  | "skierg"
  | "sled_push"
  | "sled_pull"
  | "burpee_broad_jumps"
  | "rowerg"
  | "farmers_carry"
  | "sandbag_lunges"
  | "wall_balls"
  | "compromised_running";

export type HyroxEquipmentAccess =
  | "skierg"
  | "rowerg"
  | "sled"
  | "wall_balls"
  | "sandbag"
  | "farmers_carry"
  | "treadmill"
  | "assault_bike"
  | "full_gym"
  | "dumbbells_only"
  | "no_hyrox_equipment";

export type CommunityHyroxDetails = {
  race_booked: HyroxRaceBooked | null;
  race_date: string | null;
  race_location: string | null;
  category: HyroxCategory | null;
  division: HyroxDivision | null;
  target_time: string | null;
  previous_time: string | null;
  race_priority: HyroxRacePriority | null;
  current_5k_time: string | null;
  current_10k_time: string | null;
  weekly_run_volume_km: number | null;
  longest_recent_run: string | null;
  running_confidence: number | null;
  treadmill_access: boolean;
  ski_1k_time: string | null;
  row_1k_time: string | null;
  wall_ball_standard: string | null;
  wall_ball_max_unbroken: number | null;
  burpee_broad_jump_confidence: number | null;
  farmers_carry_confidence: number | null;
  sled_push_pull_experience: SledPushPullExperience | null;
  sandbag_lunge_confidence: number | null;
  station_weaknesses: HyroxStationWeakness[];
  equipment: HyroxEquipmentAccess[];
};

export const DEFAULT_TRAINING_TRACK: CommunityTrainingTrack = "hybrid_performance";

export const TRAINING_TRACK_OPTIONS: {
  value: CommunityTrainingTrack;
  label: string;
  description: string;
}[] = [
  {
    value: "hybrid_performance",
    label: "Hybrid Performance",
    description: "Build all-round fitness, strength, running ability, physique and performance.",
  },
  {
    value: "hyrox",
    label: "HYROX Specific",
    description:
      "Prepare for HYROX with race-focused running, station development, compromised work and strength endurance.",
  },
];

export const HYROX_TRACK_POSITIONING_COPY =
  "The HYROX Specific track gives you structured HYROX-focused programming inside the Hybrid365 community. It is built from the same coaching principles as our HYROX system, but scaled for the group membership.";

export const HYROX_RACE_BOOKED_OPTIONS: { value: HyroxRaceBooked; label: string }[] = [
  { value: "yes", label: "Yes, race booked" },
  { value: "no", label: "No" },
  { value: "not_yet_but_planning", label: "Not yet, but planning" },
];

export const HYROX_CATEGORY_OPTIONS: { value: HyroxCategory; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pro", label: "Pro" },
  { value: "doubles", label: "Doubles" },
  { value: "relay", label: "Relay" },
  { value: "unsure", label: "Unsure" },
];

export const HYROX_DIVISION_OPTIONS: { value: HyroxDivision; label: string }[] = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "mixed", label: "Mixed" },
  { value: "unsure", label: "Unsure" },
];

export const HYROX_RACE_PRIORITY_OPTIONS: { value: HyroxRacePriority; label: string }[] = [
  { value: "completion", label: "Finish / complete" },
  { value: "improve_time", label: "Improve my time" },
  { value: "podium_age_group", label: "Podium age group" },
  { value: "qualify_elite", label: "Qualify / elite" },
  { value: "unsure", label: "Unsure" },
];

export const SLED_EXPERIENCE_OPTIONS: { value: SledPushPullExperience; label: string }[] = [
  { value: "none", label: "None" },
  { value: "limited", label: "Limited" },
  { value: "moderate", label: "Moderate" },
  { value: "confident", label: "Confident" },
];

export const HYROX_STATION_WEAKNESS_OPTIONS: { value: HyroxStationWeakness; label: string }[] = [
  { value: "running_between_stations", label: "Running between stations" },
  { value: "skierg", label: "SkiErg" },
  { value: "sled_push", label: "Sled push" },
  { value: "sled_pull", label: "Sled pull" },
  { value: "burpee_broad_jumps", label: "Burpee broad jumps" },
  { value: "rowerg", label: "RowErg" },
  { value: "farmers_carry", label: "Farmers carry / grip" },
  { value: "sandbag_lunges", label: "Sandbag lunges" },
  { value: "wall_balls", label: "Wall balls" },
  { value: "compromised_running", label: "Compromised running" },
];

export const HYROX_EQUIPMENT_OPTIONS: { value: HyroxEquipmentAccess; label: string }[] = [
  { value: "skierg", label: "SkiErg" },
  { value: "rowerg", label: "RowErg" },
  { value: "sled", label: "Sled / prowler" },
  { value: "wall_balls", label: "Wall balls" },
  { value: "sandbag", label: "Sandbag" },
  { value: "farmers_carry", label: "Farmers carry implements" },
  { value: "treadmill", label: "Treadmill" },
  { value: "assault_bike", label: "Assault bike / bike" },
  { value: "full_gym", label: "Full gym" },
  { value: "dumbbells_only", label: "Dumbbells only" },
  { value: "no_hyrox_equipment", label: "No HYROX equipment" },
];

export const CONFIDENCE_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function emptyHyroxDetails(): CommunityHyroxDetails {
  return {
    race_booked: null,
    race_date: null,
    race_location: null,
    category: null,
    division: null,
    target_time: null,
    previous_time: null,
    race_priority: null,
    current_5k_time: null,
    current_10k_time: null,
    weekly_run_volume_km: null,
    longest_recent_run: null,
    running_confidence: null,
    treadmill_access: false,
    ski_1k_time: null,
    row_1k_time: null,
    wall_ball_standard: null,
    wall_ball_max_unbroken: null,
    burpee_broad_jump_confidence: null,
    farmers_carry_confidence: null,
    sled_push_pull_experience: null,
    sandbag_lunge_confidence: null,
    station_weaknesses: [],
    equipment: [],
  };
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function toConfidenceOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

const RACE_BOOKED_VALUES = HYROX_RACE_BOOKED_OPTIONS.map((o) => o.value);
const CATEGORY_VALUES = HYROX_CATEGORY_OPTIONS.map((o) => o.value);
const DIVISION_VALUES = HYROX_DIVISION_OPTIONS.map((o) => o.value);
const PRIORITY_VALUES = HYROX_RACE_PRIORITY_OPTIONS.map((o) => o.value);
const SLED_VALUES = SLED_EXPERIENCE_OPTIONS.map((o) => o.value);
const WEAKNESS_VALUES = HYROX_STATION_WEAKNESS_OPTIONS.map((o) => o.value);
const EQUIPMENT_VALUES = HYROX_EQUIPMENT_OPTIONS.map((o) => o.value);

export function parseTrainingTrack(raw: unknown): CommunityTrainingTrack {
  return raw === "hyrox" ? "hyrox" : DEFAULT_TRAINING_TRACK;
}

export function parseHyroxDetails(raw: unknown): CommunityHyroxDetails {
  const base = emptyHyroxDetails();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;

  const weaknesses = Array.isArray(o.station_weaknesses)
    ? o.station_weaknesses.filter((w): w is HyroxStationWeakness =>
        isOneOf(w, WEAKNESS_VALUES)
      )
    : [];

  const equipment = Array.isArray(o.equipment)
    ? o.equipment.filter((e): e is HyroxEquipmentAccess => isOneOf(e, EQUIPMENT_VALUES))
    : [];

  return {
    race_booked: isOneOf(o.race_booked, RACE_BOOKED_VALUES) ? o.race_booked : null,
    race_date: trimOrNull(o.race_date),
    race_location: trimOrNull(o.race_location),
    category: isOneOf(o.category, CATEGORY_VALUES) ? o.category : null,
    division: isOneOf(o.division, DIVISION_VALUES) ? o.division : null,
    target_time: trimOrNull(o.target_time),
    previous_time: trimOrNull(o.previous_time),
    race_priority: isOneOf(o.race_priority, PRIORITY_VALUES) ? o.race_priority : null,
    current_5k_time: trimOrNull(o.current_5k_time),
    current_10k_time: trimOrNull(o.current_10k_time),
    weekly_run_volume_km: toNumOrNull(o.weekly_run_volume_km),
    longest_recent_run: trimOrNull(o.longest_recent_run),
    running_confidence: toConfidenceOrNull(o.running_confidence),
    treadmill_access: o.treadmill_access === true,
    ski_1k_time: trimOrNull(o.ski_1k_time),
    row_1k_time: trimOrNull(o.row_1k_time),
    wall_ball_standard: trimOrNull(o.wall_ball_standard),
    wall_ball_max_unbroken: toNumOrNull(o.wall_ball_max_unbroken),
    burpee_broad_jump_confidence: toConfidenceOrNull(o.burpee_broad_jump_confidence),
    farmers_carry_confidence: toConfidenceOrNull(o.farmers_carry_confidence),
    sled_push_pull_experience: isOneOf(o.sled_push_pull_experience, SLED_VALUES)
      ? o.sled_push_pull_experience
      : null,
    sandbag_lunge_confidence: toConfidenceOrNull(o.sandbag_lunge_confidence),
    station_weaknesses: weaknesses.slice(0, 3),
    equipment,
  };
}

export function serializeHyroxDetails(details: CommunityHyroxDetails): Record<string, unknown> {
  return {
    race_booked: details.race_booked,
    race_date: details.race_date,
    race_location: details.race_location,
    category: details.category,
    division: details.division,
    target_time: details.target_time,
    previous_time: details.previous_time,
    race_priority: details.race_priority,
    current_5k_time: details.current_5k_time,
    current_10k_time: details.current_10k_time,
    weekly_run_volume_km: details.weekly_run_volume_km,
    longest_recent_run: details.longest_recent_run,
    running_confidence: details.running_confidence,
    treadmill_access: details.treadmill_access,
    ski_1k_time: details.ski_1k_time,
    row_1k_time: details.row_1k_time,
    wall_ball_standard: details.wall_ball_standard,
    wall_ball_max_unbroken: details.wall_ball_max_unbroken,
    burpee_broad_jump_confidence: details.burpee_broad_jump_confidence,
    farmers_carry_confidence: details.farmers_carry_confidence,
    sled_push_pull_experience: details.sled_push_pull_experience,
    sandbag_lunge_confidence: details.sandbag_lunge_confidence,
    station_weaknesses: details.station_weaknesses,
    equipment: details.equipment,
  };
}

export function isHyroxSectionComplete(details: CommunityHyroxDetails): boolean {
  return (
    details.race_booked != null &&
    details.running_confidence != null &&
    details.station_weaknesses.length > 0 &&
    details.equipment.length > 0
  );
}

export function validateHyroxAssessment(
  trainingTrack: CommunityTrainingTrack,
  details: CommunityHyroxDetails
): string | null {
  if (trainingTrack !== "hyrox") return null;
  if (!details.race_booked) return "Please select whether you have a HYROX race booked.";
  if (details.running_confidence == null) return "Please rate your running confidence (1–10).";
  if (details.station_weaknesses.length === 0) {
    return "Please select at least one station weakness (up to 3).";
  }
  if (details.equipment.length === 0) {
    return "Please select at least one HYROX equipment access option.";
  }
  if (details.race_date && !/^\d{4}-\d{2}-\d{2}$/.test(details.race_date)) {
    return "HYROX race date must be YYYY-MM-DD.";
  }
  return null;
}

/** Mirror key HYROX running fields into top-level assessment columns for future generator use. */
export function hyroxDetailsToAssessmentColumns(details: CommunityHyroxDetails): {
  recent_5k_time: string | null;
  recent_10k_time: string | null;
  current_running_volume_km: number | null;
  longest_recent_run_km: number | null;
  hyrox_pb: string | null;
  event_date: string | null;
  target_time: string | null;
} {
  const longestKm = toNumOrNull(details.longest_recent_run);
  return {
    recent_5k_time: details.current_5k_time,
    recent_10k_time: details.current_10k_time,
    current_running_volume_km: details.weekly_run_volume_km,
    longest_recent_run_km: longestKm,
    hyrox_pb: details.previous_time,
    event_date: details.race_date,
    target_time: details.target_time,
  };
}

export function trainingTrackLabel(track: CommunityTrainingTrack | null | undefined): string {
  if (track === "hyrox") return "HYROX Specific";
  return "Hybrid Performance";
}

type AssessmentRowLike = {
  training_track?: string | null;
  hyrox_details?: unknown;
  recent_5k_time?: string | null;
  recent_10k_time?: string | null;
  current_running_volume_km?: number | null;
  longest_recent_run_km?: number | null;
  hyrox_pb?: string | null;
  event_date?: string | null;
  target_time?: string | null;
};

/** Merge saved hyrox_details with legacy top-level columns when details are sparse. */
export function hydrateHyroxDetailsFromAssessment(row: AssessmentRowLike | null): CommunityHyroxDetails {
  const parsed = parseHyroxDetails(row?.hyrox_details);
  if (!row) return parsed;
  return {
    ...parsed,
    current_5k_time: parsed.current_5k_time ?? row.recent_5k_time ?? null,
    current_10k_time: parsed.current_10k_time ?? row.recent_10k_time ?? null,
    weekly_run_volume_km:
      parsed.weekly_run_volume_km ?? row.current_running_volume_km ?? null,
    longest_recent_run:
      parsed.longest_recent_run ??
      (row.longest_recent_run_km != null ? String(row.longest_recent_run_km) : null),
    previous_time: parsed.previous_time ?? row.hyrox_pb ?? null,
    race_date: parsed.race_date ?? row.event_date ?? null,
    target_time: parsed.target_time ?? row.target_time ?? null,
  };
}
