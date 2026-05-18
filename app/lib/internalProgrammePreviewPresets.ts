/**
 * Preset athlete profiles for internal 12-week programme QA preview (no DB).
 */

import type { AthleteAssessmentRowForProgramme } from "./mapAssessmentToProgrammeInput";

export type PreviewPresetId =
  | "hyrox_pro_advanced"
  | "hyrox_open_intermediate"
  | "beginner_hybrid"
  | "strength_body_comp"
  | "running_focus"
  | "hyrox_limited_equipment"
  | "injury_low_impact";

export type ProgrammePreviewFormState = {
  presetId: PreviewPresetId | "custom";
  goal_focus: string;
  event_type: string;
  event_date: string;
  five_k_time: string;
  max_heart_rate: string;
  current_run_volume_band: string;
  training_days_per_week: number;
  weekly_hours_band: string;
  strength_experience: string;
  hyrox_experience: string;
  equipment: string;
  biggest_limiter: string;
  notes: string;
  double_sessions: boolean;
  double_session_days: string;
  injury_flags: string;
};

export type PreviewPresetDef = {
  id: PreviewPresetId;
  label: string;
  description: string;
  form: ProgrammePreviewFormState;
};

function baseForm(
  partial: Partial<ProgrammePreviewFormState> & Pick<ProgrammePreviewFormState, "presetId">
): ProgrammePreviewFormState {
  return {
    presetId: partial.presetId,
    goal_focus: partial.goal_focus ?? "General Hybrid Fitness",
    event_type: partial.event_type ?? "No event booked",
    event_date: partial.event_date ?? "",
    five_k_time: partial.five_k_time ?? "",
    max_heart_rate: partial.max_heart_rate ?? "",
    current_run_volume_band: partial.current_run_volume_band ?? "20-35km/week",
    training_days_per_week: partial.training_days_per_week ?? 5,
    weekly_hours_band: partial.weekly_hours_band ?? "5-7",
    strength_experience: partial.strength_experience ?? "intermediate",
    hyrox_experience: partial.hyrox_experience ?? "",
    equipment: partial.equipment ?? "Full gym",
    biggest_limiter: partial.biggest_limiter ?? "",
    notes: partial.notes ?? "",
    double_sessions: partial.double_sessions ?? false,
    double_session_days: partial.double_session_days ?? "",
    injury_flags: partial.injury_flags ?? "",
  };
}

export const PROGRAMME_PREVIEW_PRESETS: PreviewPresetDef[] = [
  {
    id: "hyrox_pro_advanced",
    label: "A. Advanced HYROX Pro",
    description: "7 days, doubles, 16:30 5k, high run volume, Pro event",
    form: baseForm({
      presetId: "hyrox_pro_advanced",
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Pro",
      event_date: "2026-09-15",
      five_k_time: "16:30",
      max_heart_rate: "192",
      current_run_volume_band: "50-70km/week",
      training_days_per_week: 7,
      weekly_hours_band: "10+",
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: "Full gym",
      biggest_limiter: "Running under fatigue after stations; wall balls",
      double_sessions: true,
      double_session_days: "Tue, Thu, Sat",
    }),
  },
  {
    id: "hyrox_open_intermediate",
    label: "B. Intermediate HYROX Open",
    description: "5 days, 22:00 5k, wall ball limiter",
    form: baseForm({
      presetId: "hyrox_open_intermediate",
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Open",
      five_k_time: "22:00",
      current_run_volume_band: "20-35km/week",
      training_days_per_week: 5,
      weekly_hours_band: "7-10",
      strength_experience: "intermediate",
      hyrox_experience: "some experience",
      biggest_limiter: "Wall balls gas me early",
    }),
  },
  {
    id: "beginner_hybrid",
    label: "C. Beginner general hybrid",
    description: "No event, slower 5k, low volume, 4 days",
    form: baseForm({
      presetId: "beginner_hybrid",
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      five_k_time: "30:00",
      current_run_volume_band: "0-10km/week",
      training_days_per_week: 4,
      weekly_hours_band: "3-5",
      strength_experience: "beginner",
    }),
  },
  {
    id: "strength_body_comp",
    label: "D. Strength / body composition",
    description: "Muscle goal, moderate running, 5 days",
    form: baseForm({
      presetId: "strength_body_comp",
      goal_focus: "Build Strength Without Losing Fitness",
      event_type: "No event booked",
      five_k_time: "24:00",
      current_run_volume_band: "10-20km/week",
      training_days_per_week: 5,
      weekly_hours_band: "5-7",
      strength_experience: "intermediate",
      biggest_limiter: "Body composition — want to lean out while keeping strength",
    }),
  },
  {
    id: "running_focus",
    label: "E. Running-focused hybrid",
    description: "Running goal, 19:00 5k, higher run volume",
    form: baseForm({
      presetId: "running_focus",
      goal_focus: "Run Faster / Improve Engine",
      event_type: "Running race",
      five_k_time: "19:00",
      current_run_volume_band: "35-50km/week",
      training_days_per_week: 6,
      weekly_hours_band: "7-10",
      strength_experience: "intermediate",
    }),
  },
  {
    id: "hyrox_limited_equipment",
    label: "F. Limited equipment HYROX",
    description: "HYROX goal, no sled/wall balls, home gym",
    form: baseForm({
      presetId: "hyrox_limited_equipment",
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: "Hyrox Open",
      five_k_time: "26:00",
      current_run_volume_band: "20-35km/week",
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      strength_experience: "intermediate",
      equipment: "Home Gym, Minimal Equipment",
      biggest_limiter: "Sled and wall balls — no access",
      notes: "No sled, no wall balls, limited SkiErg — bike and dumbbells only",
    }),
  },
  {
    id: "injury_low_impact",
    label: "G. Injury / low-impact",
    description: "Knee/calf limits, ergs available",
    form: baseForm({
      presetId: "injury_low_impact",
      goal_focus: "General Hybrid Fitness",
      event_type: "No event booked",
      five_k_time: "25:00",
      current_run_volume_band: "10-20km/week",
      training_days_per_week: 4,
      weekly_hours_band: "5-7",
      strength_experience: "intermediate",
      biggest_limiter: "Knee and calf — need low impact",
      notes: "Bad knees — prefer bike, row, ski over running when possible. No burpees if possible.",
      injury_flags: "Knee pain, calf tightness",
    }),
  },
];

export function assessmentFromPreviewForm(
  form: ProgrammePreviewFormState
): AthleteAssessmentRowForProgramme {
  const maxHrRaw = form.max_heart_rate.trim();
  const max_heart_rate =
    maxHrRaw && Number.isFinite(Number(maxHrRaw))
      ? Math.min(230, Math.max(100, Math.round(Number(maxHrRaw))))
      : null;

  const parseList = (raw: string) =>
    raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    first_name: "Preview",
    goal_focus: form.goal_focus.trim() || null,
    event_type: form.event_type.trim() || null,
    event_date: form.event_date.trim() || null,
    target_time: null,
    training_days_per_week: Math.min(7, Math.max(2, form.training_days_per_week)),
    weekly_hours_band: form.weekly_hours_band.trim() || null,
    preferred_training_days: null,
    double_session_days: form.double_sessions ? parseList(form.double_session_days) : null,
    recent_5k_time: form.five_k_time.trim() || null,
    max_heart_rate,
    strength_experience: form.strength_experience.trim() || null,
    hyrox_experience: form.hyrox_experience.trim() || null,
    equipment: parseList(form.equipment).length ? parseList(form.equipment) : ["Full gym"],
    injury_flags: parseList(form.injury_flags).length ? parseList(form.injury_flags) : null,
    movements_to_avoid: null,
    biggest_limiter: form.biggest_limiter.trim() || null,
    notes: form.notes.trim() || null,
    hyrox_pb: null,
    current_run_volume_band: form.current_run_volume_band.trim() || null,
    completed_at: new Date().toISOString(),
  };
}
