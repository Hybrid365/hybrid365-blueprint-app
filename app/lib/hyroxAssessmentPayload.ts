import type { HyroxAssessmentRow, HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAssessmentInput } from "@/app/lib/hyroxAthleteProfileTypes";
import type { StationWeakness } from "@/src/lib/hyrox/types";

export type AssessmentFormValues = Record<string, unknown>;

const SLEEP_VALUES = new Set(["good", "average", "poor"]);
const STRESS_VALUES = new Set(["low", "moderate", "high"]);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(typeof v === "string" ? v.trim() : v);
  return Number.isFinite(n) ? n : null;
}

function intNum(v: unknown): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function textOrNull(v: unknown): string | null {
  const s = str(v);
  return s || null;
}

function textArrayOrNull(v: unknown): string[] | null {
  const arr = strArray(v);
  return arr.length ? arr : null;
}

function toJsonb(values: AssessmentFormValues): HyroxJson {
  try {
    return JSON.parse(JSON.stringify(values ?? {})) as HyroxJson;
  } catch {
    return {};
  }
}

function parseSleepQuality(values: AssessmentFormValues): "good" | "average" | "poor" {
  const q = num(values.sleepQualityScore);
  if (q != null && q <= 4) return "poor";
  if (q != null && q <= 6) return "average";
  const text = str(values.sleepQualityScore);
  if (text) {
    const n = Number(text);
    if (Number.isFinite(n) && n <= 4) return "poor";
    if (Number.isFinite(n) && n <= 6) return "average";
  }
  const raw = str(values.sleepQuality).toLowerCase();
  if (SLEEP_VALUES.has(raw)) return raw as "good" | "average" | "poor";
  return "good";
}

function parseStressLevel(values: AssessmentFormValues): "low" | "moderate" | "high" {
  const s = num(values.stressLevelScore);
  if (s != null && s >= 8) return "high";
  if (s != null && s >= 5) return "moderate";
  const raw = str(values.stressLevel).toLowerCase();
  if (STRESS_VALUES.has(raw)) return raw as "low" | "moderate" | "high";
  return "low";
}

function parseExperience(values: AssessmentFormValues): HyroxAssessmentInput["experienceHyrox"] {
  const races = num(values.hyroxRacesCompleted) ?? 0;
  if (races === 0) return "none";
  if (races >= 5) return "competitive";
  if (races >= 2) return "seasoned";
  return "some";
}

function parseStrengthRating(values: AssessmentFormValues): HyroxAssessmentInput["strengthSelfRating"] {
  const exp = str(values.strengthExperience).toLowerCase();
  if (exp.includes("advanced")) return "high";
  if (exp.includes("beginner")) return "low";
  return "moderate";
}

function stationWeaknessesFromRatings(values: AssessmentFormValues): string[] {
  const ratings = values.stationRatings as Record<string, number> | undefined;
  if (!ratings || typeof ratings !== "object") return ["none_significant"];

  const map: Record<string, StationWeakness> = {
    SkiErg: "ski",
    "Sled push": "sled_push_pull",
    "Sled pull": "sled_push_pull",
    "Burpee broad jumps": "burpees",
    Row: "row",
    "Farmer's carry": "farmers_carry",
    "Sandbag lunges": "lunges",
    "Wall balls": "wall_balls",
  };

  const weak: string[] = [];
  for (const [label, score] of Object.entries(ratings)) {
    if (typeof score === "number" && score <= 4) {
      const w = map[label];
      if (w) weak.push(w);
    }
  }
  return weak.length ? weak : ["none_significant"];
}

function equipmentFromChecklist(values: AssessmentFormValues): HyroxAssessmentInput["equipmentAvailable"] {
  const list = strArray(values.equipmentAccess);
  const has = (s: string) => list.some((x) => x.toLowerCase().includes(s.toLowerCase()));
  return {
    treadmill: has("treadmill"),
    track: has("track"),
    skiErg: has("ski"),
    rowErg: has("row"),
    bike: has("bike"),
    sled: has("sled"),
    wallBalls: has("wall"),
    farmersHandles: has("farmer"),
    sandbag: has("sandbag"),
    fullGym: has("barbell") || has("squat"),
  };
}

function parseDocumentationConsent(values: AssessmentFormValues): boolean {
  if (typeof values.documentationConsent === "boolean") return values.documentationConsent;
  if (typeof values.docConsent === "boolean") return values.docConsent;
  const s = str(values.docConsent).toLowerCase();
  return (
    s === "true" ||
    s === "yes" ||
    s === "1" ||
    s.includes("full") ||
    s.includes("consent")
  );
}

/** Map form state → hyrox_assessments insert row (schema-aligned columns + raw_answers). */
export function buildAssessmentDbPayload(values: AssessmentFormValues) {
  const injuryParts = [
    str(values.currentInjuries),
    str(values.previousInjuries),
    str(values.movementsToAvoid),
    str(values.runningInjuryHistory),
  ].filter(Boolean);

  return {
    raw_answers: toJsonb(values),
    training_days: intNum(values.trainingDaysPerWeek),
    weekly_training_hours: num(values.weeklyTrainingHours),
    current_weekly_run_volume_km:
      num(values.weeklyRunVolumeKm) ?? num(values.runningWeeklyVolumeKm),
    five_k_time: textOrNull(values.fiveKmTime),
    ten_k_time: textOrNull(values.tenKmTime),
    max_heart_rate: intNum(values.maxHeartRate),
    threshold_heart_rate: intNum(values.thresholdHeartRate),
    station_weaknesses: stationWeaknessesFromRatings(values),
    equipment_access: textArrayOrNull(values.equipmentAccess),
    injury_flags: injuryParts.length ? injuryParts : null,
    sleep_quality: parseSleepQuality(values),
    stress_level: parseStressLevel(values),
    bodyweight: num(values.bodyweightKg),
    body_composition_goal:
      textOrNull(values.bodyCompositionGoal) ?? textOrNull(values.nutritionGoal),
    documentation_consent: parseDocumentationConsent(values),
  };
}

export const HYROX_ASSESSMENT_SELECT =
  "id, athlete_id, created_at, updated_at, submitted_at, raw_answers, training_days, weekly_training_hours, current_weekly_run_volume_km, five_k_time, ten_k_time, max_heart_rate, threshold_heart_rate, station_weaknesses, equipment_access, injury_flags, sleep_quality, stress_level, bodyweight, body_composition_goal, documentation_consent, status";

/** Full row for insert (caller sets athlete_id). */
export function buildAssessmentInsertRow(values: AssessmentFormValues) {
  const submitted_at = new Date().toISOString();
  return {
    ...buildAssessmentDbPayload(values),
    status: "submitted" as const,
    submitted_at,
  };
}

/** Build HyroxAssessmentInput for mapAssessmentToAthleteProfile from saved row + athlete. */
export function buildHyroxAssessmentInputFromRow(
  athlete: {
    id: string;
    name: string;
    email: string;
    race_name: string | null;
    race_date: string | null;
    race_category: string | null;
    target_time: string | null;
  },
  row: HyroxAssessmentRow
): HyroxAssessmentInput {
  const raw = (row.raw_answers ?? {}) as AssessmentFormValues;
  const trainingDays =
    strArray(raw.trainingDays).length > 0
      ? strArray(raw.trainingDays)
      : row.training_days != null
        ? Array.from({ length: row.training_days }, (_, i) => i + 1)
        : ["Tue", "Thu", "Sat"];

  return {
    athleteId: athlete.id,
    submittedAt: row.submitted_at ?? row.created_at,
    name: str(raw.fullName) || athlete.name,
    email: str(raw.email) || athlete.email,
    raceName: str(raw.raceLocation) || athlete.race_name || "TBC",
    raceDate: str(raw.raceDate) || athlete.race_date || "",
    raceCategory: str(raw.raceCategory) || athlete.race_category || "Open",
    targetTimeBand: str(raw.targetTime) || athlete.target_time || undefined,
    trainingDaysPreference: trainingDays,
    weeklyTrainingHoursTarget: row.weekly_training_hours ?? num(raw.weeklyTrainingHours) ?? 6,
    currentWeeklyRunVolumeKm:
      row.current_weekly_run_volume_km ??
      num(raw.weeklyRunVolumeKm) ??
      num(raw.runningWeeklyVolumeKm) ??
      20,
    recentTrainingSummary:
      str(raw.weeklyTrainingStructure) || str(raw.currentStruggles) || "See assessment raw_answers.",
    recentThresholdSession: str(raw.recentThresholdSession) || undefined,
    fiveKmTime: row.five_k_time ?? str(raw.fiveKmTime) ?? "",
    tenKmTime: row.ten_k_time ?? str(raw.tenKmTime) ?? "",
    usesHeartRateMonitor: row.max_heart_rate != null || row.threshold_heart_rate != null,
    maxHeartRate: row.max_heart_rate,
    thresholdHeartRate: row.threshold_heart_rate,
    experienceHyrox: parseExperience(raw),
    strengthSelfRating: parseStrengthRating(raw),
    stationWeaknesses: (row.station_weaknesses as StationWeakness[]) ?? stationWeaknessesFromRatings(raw),
    equipmentAvailable: equipmentFromChecklist(raw),
    equipmentLimitations: str(raw.equipmentNotes) || undefined,
    injuryFlags: row.injury_flags ?? [],
    sleepQuality:
      (row.sleep_quality as HyroxAssessmentInput["sleepQuality"]) ?? parseSleepQuality(raw),
    stressLevel:
      (row.stress_level as HyroxAssessmentInput["stressLevel"]) ?? parseStressLevel(raw),
    recoveryNotes: str(raw.recoveryTools) || undefined,
    bodyweightKg: row.bodyweight ?? num(raw.bodyweightKg) ?? undefined,
    bodyCompositionGoal:
      row.body_composition_goal ?? (str(raw.bodyCompositionGoal) || undefined),
    contentConsent: strArray(raw.additionalConsent).length > 0,
    documentationConsent: row.documentation_consent,
  };
}
