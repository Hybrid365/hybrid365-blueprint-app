import type { HyroxApplicationRow, HyroxAssessmentRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAssessmentInput } from "@/app/lib/hyroxAthleteProfileTypes";

export type AssessmentDisplayRow = { label: string; value: string };

export type AssessmentDisplaySection = {
  title: string;
  rows: AssessmentDisplayRow[];
};

export type AdminAssessmentDisplayData = {
  source: "onboarding_assessment" | "application" | "both" | "none";
  submittedAt: string | null;
  sections: AssessmentDisplaySection[];
  unmappedFields: AssessmentDisplayRow[];
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  age: "Age",
  location: "Location",
  instagram: "Instagram",
  occupation: "Occupation",
  workSchedule: "Work schedule",
  weeklyCommitments: "Weekly commitments",
  raceBooked: "Race booked",
  raceLocation: "Race location",
  raceDate: "Race date",
  raceCategory: "Race category",
  targetTime: "Target time",
  previousHyroxPb: "Previous Hyrox PB",
  blockSuccess: "Block success criteria",
  hyroxRacesCompleted: "Hyrox races completed",
  bestOverallTime: "Best overall time",
  strongestStation: "Strongest station",
  weakestStationSelf: "Weakest station (self-reported)",
  raceFade: "Race fade notes",
  lastRaceLearnings: "Last race learnings",
  weeklyTrainingStructure: "Weekly training structure",
  trainingDaysPerWeek: "Training days per week",
  weeklyTrainingHours: "Weekly training hours",
  weeklyRunVolumeKm: "Weekly run volume (km)",
  strengthSessionsPerWeek: "Strength sessions per week",
  hyroxSessionsPerWeek: "Hyrox sessions per week",
  currentStruggles: "Current struggles",
  trainingDays: "Available training days",
  doubleSessionDays: "Double-session days",
  preferredRestDay: "Preferred rest day",
  longSessionDay: "Long session day",
  weekdaySessionTime: "Weekday session time",
  weekendSessionTime: "Weekend session time",
  upcomingTravel: "Upcoming travel / events",
  equipmentAccess: "Equipment access",
  equipmentNotes: "Equipment notes",
  fiveKmTime: "5 km time",
  tenKmTime: "10 km time",
  easyRunPace: "Easy run pace",
  maxHeartRate: "Max heart rate",
  thresholdHeartRate: "Threshold heart rate",
  runningWeeklyVolumeKm: "Running weekly volume (km)",
  peakWeeklyRunKm: "Peak weekly run volume (km)",
  speedVsEndurance: "Speed vs endurance",
  runningInjuryHistory: "Running injury history",
  strengthExperience: "Strength experience",
  squatEstimate: "Squat estimate",
  deadliftEstimate: "Deadlift estimate",
  lungeLoad: "Lunge load",
  pullupAbility: "Pull-up ability",
  legsImpactRunning: "Legs impact on running",
  movementsCannotDo: "Movements cannot do",
  stationRatings: "Station ratings",
  currentInjuries: "Current injuries",
  previousInjuries: "Previous injuries",
  sleepHours: "Sleep hours",
  sleepQualityScore: "Sleep quality score",
  stressLevelScore: "Stress level score",
  recoveryTools: "Recovery tools",
  movementsToAvoid: "Movements to avoid",
  bodyweightKg: "Bodyweight (kg)",
  heightCm: "Height (cm)",
  bodyCompositionGoal: "Body composition goal",
  nutritionGoal: "Nutrition goal",
  macroTracking: "Macro tracking",
  preTrainingFuel: "Pre-training fuel",
  digestiveIssues: "Digestive issues",
  supplements: "Supplements",
  coachingNeeds: "Coaching needs",
  feedbackStyle: "Feedback style",
  trainingVolumeTendency: "Training volume tendency",
  consistencyScore: "Consistency score",
  fallOffCauses: "Fall-off causes",
  docConsent: "Documentation consent",
  additionalConsent: "Additional consent",
  privateTopics: "Private topics",
  recentThresholdSession: "Recent threshold session",
  documentationConsent: "Documentation consent (form)",
};

const MAPPED_RAW_KEYS = new Set(Object.keys(FIELD_LABELS));

function dash(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join(", ");
    return joined || "—";
  }
  if (typeof value === "object") return formatObjectValue(value);
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "see assessment") return "—";
  return text;
}

function formatObjectValue(value: object): string {
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v != null && String(v).trim() !== ""
  );
  if (!entries.length) return "—";
  return entries
    .map(([k, v]) => `${humanizeKey(k)}: ${typeof v === "number" ? `${v}/10` : dash(v)}`)
    .join(" · ");
}

function humanizeKey(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function rawField(raw: Record<string, unknown>, key: string, fallback?: unknown): string {
  if (raw[key] != null && raw[key] !== "") return dash(raw[key]);
  if (fallback != null && fallback !== "") return dash(fallback);
  return "—";
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatEquipmentFromInput(input: HyroxAssessmentInput | null): string {
  if (!input) return "—";
  const labels: Record<keyof HyroxAssessmentInput["equipmentAvailable"], string> = {
    treadmill: "Treadmill",
    track: "Track",
    skiErg: "SkiErg",
    rowErg: "RowErg",
    bike: "Bike",
    sled: "Sled",
    wallBalls: "Wall balls",
    farmersHandles: "Farmers handles",
    sandbag: "Sandbag",
    fullGym: "Full gym",
  };
  const selected = Object.entries(input.equipmentAvailable)
    .filter(([, enabled]) => enabled)
    .map(([key]) => labels[key as keyof typeof labels] ?? key);
  return selected.length ? selected.join(", ") : "—";
}

function experienceLabel(value: HyroxAssessmentInput["experienceHyrox"] | undefined): string {
  if (!value) return "—";
  return ({ none: "None", some: "Some", seasoned: "Seasoned", competitive: "Competitive" } as const)[value];
}

function strengthLabel(value: HyroxAssessmentInput["strengthSelfRating"] | undefined): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildUnmappedFields(raw: Record<string, unknown>): AssessmentDisplayRow[] {
  return Object.entries(raw)
    .filter(([key, value]) => !MAPPED_RAW_KEYS.has(key) && value != null && String(value).trim() !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ label: humanizeKey(key), value: dash(value) }));
}

function alwaysSection(title: string, rows: AssessmentDisplayRow[]): AssessmentDisplaySection {
  return { title, rows };
}

export function buildAdminAssessmentDisplay(input: {
  athlete: { name: string; email: string; race_name?: string | null; race_date?: string | null; race_category?: string | null; target_time?: string | null };
  assessmentRow?: HyroxAssessmentRow | null;
  assessmentInput?: HyroxAssessmentInput | null;
  applicationRow?: HyroxApplicationRow | null;
}): AdminAssessmentDisplayData {
  const { athlete, assessmentRow, assessmentInput, applicationRow } = input;
  const raw = (assessmentRow?.raw_answers ?? {}) as Record<string, unknown>;
  const appRaw = (applicationRow?.raw_payload ?? {}) as Record<string, unknown>;

  const hasAssessment = Boolean(assessmentRow?.submitted_at || assessmentInput);
  const hasApplication = Boolean(applicationRow);

  let source: AdminAssessmentDisplayData["source"] = "none";
  if (hasAssessment && hasApplication) source = "both";
  else if (hasAssessment) source = "onboarding_assessment";
  else if (hasApplication) source = "application";

  const submittedAt =
    assessmentRow?.submitted_at ??
    assessmentInput?.submittedAt ??
    applicationRow?.created_at ??
    null;

  const sections: AssessmentDisplaySection[] = [
    alwaysSection("Athlete details", [
      {
        label: "Name",
        value: dash(raw.fullName ?? assessmentInput?.name ?? applicationRow?.name ?? athlete.name),
      },
      {
        label: "Email",
        value: dash(raw.email ?? assessmentInput?.email ?? applicationRow?.email ?? athlete.email),
      },
      { label: "Submitted at", value: formatTimestamp(submittedAt) },
      {
        label: "Source",
        value:
          source === "both"
            ? "Application + onboarding assessment"
            : source === "onboarding_assessment"
            ? "Onboarding assessment"
            : source === "application"
            ? "Application"
            : "—",
      },
      { label: "Phone", value: rawField(raw, "phone", applicationRow?.phone) },
      { label: "Instagram", value: rawField(raw, "instagram", applicationRow?.instagram_handle) },
      { label: "Age", value: rawField(raw, "age") },
      { label: "Location", value: rawField(raw, "location", appRaw.location) },
      { label: "Occupation", value: rawField(raw, "occupation") },
      { label: "Work schedule", value: rawField(raw, "workSchedule") },
      { label: "Weekly commitments", value: rawField(raw, "weeklyCommitments") },
    ]),
    alwaysSection("Goal / race", [
      {
        label: "Race date",
        value: rawField(raw, "raceDate", assessmentInput?.raceDate ?? athlete.race_date ?? applicationRow?.target_date),
      },
      {
        label: "Target race",
        value: rawField(
          raw,
          "raceLocation",
          assessmentInput?.raceName ?? athlete.race_name ?? applicationRow?.target_event
        ),
      },
      {
        label: "Main goal",
        value: rawField(raw, "blockSuccess", applicationRow?.goal ?? appRaw.main_goal),
      },
      {
        label: "Target time",
        value: rawField(raw, "targetTime", assessmentInput?.targetTimeBand ?? athlete.target_time),
      },
      { label: "Race category", value: rawField(raw, "raceCategory", assessmentInput?.raceCategory ?? athlete.race_category) },
      { label: "Race booked", value: rawField(raw, "raceBooked") },
      { label: "Previous Hyrox PB", value: rawField(raw, "previousHyroxPb", appRaw.hyrox_pb) },
      {
        label: "Hyrox experience",
        value:
          rawField(raw, "hyroxRacesCompleted") !== "—"
            ? `${rawField(raw, "hyroxRacesCompleted")} races · ${experienceLabel(assessmentInput?.experienceHyrox)}`
            : dash(applicationRow?.hyrox_experience ?? experienceLabel(assessmentInput?.experienceHyrox)),
      },
      {
        label: "Current level",
        value: dash(applicationRow?.current_level ?? appRaw.five_km_time ?? strengthLabel(assessmentInput?.strengthSelfRating)),
      },
      { label: "Reason for applying", value: dash(applicationRow?.reason_for_applying) },
    ]),
    alwaysSection("Training availability", [
      {
        label: "Training days per week",
        value: rawField(raw, "trainingDaysPerWeek", assessmentRow?.training_days ?? assessmentInput?.trainingDaysPreference.length),
      },
      {
        label: "Weekly hours",
        value: rawField(raw, "weeklyTrainingHours", assessmentRow?.weekly_training_hours ?? assessmentInput?.weeklyTrainingHoursTarget),
      },
      {
        label: "Preferred training days",
        value: rawField(raw, "trainingDays", assessmentInput?.trainingDaysPreference),
      },
      { label: "Double-session days", value: rawField(raw, "doubleSessionDays") },
      { label: "Preferred rest day", value: rawField(raw, "preferredRestDay") },
      { label: "Long session day", value: rawField(raw, "longSessionDay") },
      { label: "Weekday session time", value: rawField(raw, "weekdaySessionTime") },
      { label: "Weekend session time", value: rawField(raw, "weekendSessionTime") },
      { label: "Upcoming travel / events", value: rawField(raw, "upcomingTravel") },
      {
        label: "Current routine",
        value: rawField(raw, "weeklyTrainingStructure", assessmentInput?.recentTrainingSummary ?? appRaw.training_history),
      },
      { label: "Strength sessions / week", value: rawField(raw, "strengthSessionsPerWeek") },
      { label: "Hyrox sessions / week", value: rawField(raw, "hyroxSessionsPerWeek") },
      { label: "Current struggles", value: rawField(raw, "currentStruggles") },
    ]),
    alwaysSection("Running profile", [
      { label: "Recent 5k", value: rawField(raw, "fiveKmTime", assessmentRow?.five_k_time ?? assessmentInput?.fiveKmTime ?? appRaw.five_km_time) },
      { label: "Recent 10k", value: rawField(raw, "tenKmTime", assessmentRow?.ten_k_time ?? assessmentInput?.tenKmTime) },
      {
        label: "Run volume (km/week)",
        value: rawField(
          raw,
          "weeklyRunVolumeKm",
          assessmentRow?.current_weekly_run_volume_km ?? assessmentInput?.currentWeeklyRunVolumeKm ?? appRaw.weekly_training
        ),
      },
      { label: "Average weekly run volume", value: rawField(raw, "runningWeeklyVolumeKm") },
      { label: "Peak weekly run volume", value: rawField(raw, "peakWeeklyRunKm") },
      { label: "Easy run pace", value: rawField(raw, "easyRunPace") },
      { label: "Speed vs endurance", value: rawField(raw, "speedVsEndurance") },
      { label: "Max heart rate", value: rawField(raw, "maxHeartRate", assessmentRow?.max_heart_rate ?? assessmentInput?.maxHeartRate) },
      {
        label: "Threshold heart rate",
        value: rawField(raw, "thresholdHeartRate", assessmentRow?.threshold_heart_rate ?? assessmentInput?.thresholdHeartRate),
      },
      { label: "Recent threshold session", value: rawField(raw, "recentThresholdSession", assessmentInput?.recentThresholdSession) },
      { label: "Running injury history", value: rawField(raw, "runningInjuryHistory") },
      { label: "Uses heart rate monitor", value: dash(assessmentInput?.usesHeartRateMonitor) },
    ]),
    alwaysSection("Hyrox / station profile", [
      { label: "Hyrox races completed", value: rawField(raw, "hyroxRacesCompleted") },
      { label: "Best overall time", value: rawField(raw, "bestOverallTime") },
      { label: "Strongest station", value: rawField(raw, "strongestStation") },
      { label: "Weakest station (self-reported)", value: rawField(raw, "weakestStationSelf", appRaw.weakness) },
      {
        label: "Station weaknesses (derived)",
        value: dash(assessmentRow?.station_weaknesses ?? assessmentInput?.stationWeaknesses),
      },
      { label: "Station ratings", value: formatObjectValue((raw.stationRatings as object) ?? {}) },
      { label: "Race fade notes", value: rawField(raw, "raceFade") },
      { label: "Last race learnings", value: rawField(raw, "lastRaceLearnings") },
    ]),
    alwaysSection("Strength profile", [
      { label: "Gym / strength experience", value: rawField(raw, "strengthExperience", strengthLabel(assessmentInput?.strengthSelfRating)) },
      { label: "Squat estimate", value: rawField(raw, "squatEstimate") },
      { label: "Deadlift estimate", value: rawField(raw, "deadliftEstimate") },
      { label: "Lunge load", value: rawField(raw, "lungeLoad") },
      { label: "Pull-up ability", value: rawField(raw, "pullupAbility") },
      { label: "Legs impact on running", value: rawField(raw, "legsImpactRunning") },
      { label: "Movements cannot do", value: rawField(raw, "movementsCannotDo") },
    ]),
    alwaysSection("Equipment access", [
      { label: "Equipment checklist", value: rawField(raw, "equipmentAccess", assessmentRow?.equipment_access) },
      { label: "Equipment from profile", value: formatEquipmentFromInput(assessmentInput ?? null) },
      { label: "Equipment notes", value: rawField(raw, "equipmentNotes", assessmentInput?.equipmentLimitations) },
      { label: "Team training preference", value: dash(appRaw.team_training) },
    ]),
    alwaysSection("Recovery / injury", [
      { label: "Current injuries", value: rawField(raw, "currentInjuries") },
      { label: "Previous injuries", value: rawField(raw, "previousInjuries") },
      { label: "Injury flags (stored)", value: dash(assessmentRow?.injury_flags ?? assessmentInput?.injuryFlags) },
      { label: "Movements to avoid", value: rawField(raw, "movementsToAvoid") },
      { label: "Sleep (hours)", value: rawField(raw, "sleepHours") },
      { label: "Sleep quality score", value: rawField(raw, "sleepQualityScore", assessmentRow?.sleep_quality ?? assessmentInput?.sleepQuality) },
      { label: "Stress level score", value: rawField(raw, "stressLevelScore", assessmentRow?.stress_level ?? assessmentInput?.stressLevel) },
      { label: "Recovery tools", value: rawField(raw, "recoveryTools", assessmentInput?.recoveryNotes) },
    ]),
    alwaysSection("Nutrition / bodyweight", [
      { label: "Bodyweight (kg)", value: rawField(raw, "bodyweightKg", assessmentRow?.bodyweight ?? assessmentInput?.bodyweightKg) },
      { label: "Height (cm)", value: rawField(raw, "heightCm") },
      {
        label: "Body composition goal",
        value: rawField(raw, "bodyCompositionGoal", assessmentRow?.body_composition_goal ?? assessmentInput?.bodyCompositionGoal),
      },
      { label: "Nutrition goal", value: rawField(raw, "nutritionGoal") },
      { label: "Macro tracking", value: rawField(raw, "macroTracking") },
      { label: "Pre-training fuel", value: rawField(raw, "preTrainingFuel") },
      { label: "Digestive issues", value: rawField(raw, "digestiveIssues") },
      { label: "Supplements", value: rawField(raw, "supplements") },
    ]),
    alwaysSection("Benchmarks / testing", [
      { label: "5k", value: rawField(raw, "fiveKmTime", assessmentRow?.five_k_time ?? assessmentInput?.fiveKmTime) },
      { label: "10k", value: rawField(raw, "tenKmTime", assessmentRow?.ten_k_time ?? assessmentInput?.tenKmTime) },
      { label: "Bodyweight", value: rawField(raw, "bodyweightKg", assessmentRow?.bodyweight) },
      { label: "Application 5k (apply form)", value: dash(appRaw.five_km_time) },
    ]),
    alwaysSection("Coaching preferences", [
      { label: "Coaching needs", value: rawField(raw, "coachingNeeds") },
      { label: "Feedback style", value: rawField(raw, "feedbackStyle") },
      { label: "Training volume tendency", value: rawField(raw, "trainingVolumeTendency") },
      { label: "Consistency score", value: rawField(raw, "consistencyScore") },
      { label: "Fall-off causes", value: rawField(raw, "fallOffCauses") },
    ]),
    alwaysSection("Content / documentation consent", [
      { label: "Documentation consent", value: dash(assessmentRow?.documentation_consent ?? assessmentInput?.documentationConsent ?? applicationRow?.documentation_interest) },
      { label: "Documentation preference (form)", value: rawField(raw, "docConsent") },
      { label: "Content consent", value: dash(assessmentInput?.contentConsent) },
      { label: "Additional consent", value: rawField(raw, "additionalConsent") },
      { label: "Private topics", value: rawField(raw, "privateTopics") },
      { label: "Application consent notes", value: dash(appRaw.consent ?? appRaw.documented_preference) },
    ]),
  ];

  const unmappedFields = [
    ...buildUnmappedFields(raw),
    ...buildUnmappedFields(appRaw).map((row) => ({
      label: `Application · ${row.label}`,
      value: row.value,
    })),
  ];

  return {
    source,
    submittedAt,
    sections,
    unmappedFields,
  };
}

export function buildRawAssessmentDebugPayload(input: {
  assessmentRow?: HyroxAssessmentRow | null;
  applicationRow?: HyroxApplicationRow | null;
}): Record<string, unknown> {
  return {
    assessment: input.assessmentRow ?? null,
    application: input.applicationRow ?? null,
  };
}
