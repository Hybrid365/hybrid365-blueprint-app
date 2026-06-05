import type {
  CommunityTrainingTrack,
  HyroxEquipmentAccess,
  HyroxStationWeakness,
  SledPushPullExperience,
} from "@/app/lib/communityHyroxAssessment";
import type { SecondaryGoalKind } from "./hyroxGoalGuardrail";

export type PreviewAbilityLevel = "beginner" | "intermediate" | "advanced";

export type PreviewStress = "easy" | "moderate" | "hard";

export type BlockPhase = "base" | "build" | "race_prep" | "test_retest";

export type SessionModality =
  | "run"
  | "bike"
  | "ski"
  | "row"
  | "strength"
  | "hybrid"
  | "mobility"
  | "mixed";

export type HyroxPillar =
  | "threshold_run"
  | "erg_aerobic"
  | "erg_threshold_station"
  | "lower_strength_endurance"
  | "upper_grip"
  | "compromised_hyrox"
  | "long_easy_aerobic"
  | "tempo_support"
  | "hybrid_strength"
  | "conditioning"
  | "recovery";

export type CommunityPreviewInput = {
  training_track: CommunityTrainingTrack;
  /** Primary programming identity — always hyrox_performance for HYROX track. */
  primary_goal: "hyrox_performance";
  /** General assessment goal (secondary context only). */
  secondary_goal_context: string | null;
  secondary_goal_kind: SecondaryGoalKind;
  secondary_goal_support_note: string | null;
  /** Extra tempo/run layering from general running goals — never replaces HYROX pillars. */
  emphasise_running_support: boolean;
  ability_level: PreviewAbilityLevel;
  training_days_per_week: 3 | 4 | 5 | 6;
  weekly_training_hours: string;
  session_length: string;
  double_session_availability: boolean;
  equipment_access: string[];
  injury_limitations: string;
  current_5k_time: string;
  current_10k_time: string;
  weekly_run_volume_km: string;
  running_confidence: number | null;
  race_booked: string;
  race_date: string;
  race_category: string;
  race_target_time: string;
  station_weaknesses: HyroxStationWeakness[];
  hyrox_equipment: HyroxEquipmentAccess[];
  ski_1k_time: string;
  row_1k_time: string;
  wall_ball_standard: string;
  sled_experience: SledPushPullExperience | "";
  compromised_running_confidence: number | null;
  /** Which 4-week block in the member journey (default 1 = Base). */
  block_number: number;
};

export type PreviewOptionalAddon = {
  title: string;
  duration_minutes: number;
  duration_range: string;
  rpe: string;
  modality: SessionModality;
  purpose: string;
  skip_when: string;
  coach_support_note: string | null;
};

export type PreviewSessionMetadata = {
  planned_duration_minutes: number;
  planned_aerobic_minutes: number;
  planned_threshold_minutes: number;
  planned_run_minutes: number;
  planned_run_distance_km: number | null;
  planned_erg_minutes: number;
  planned_strength_minutes: number;
  planned_station_volume: number | null;
  session_stress: PreviewStress;
  modality: SessionModality;
  hyrox_pillar: HyroxPillar | null;
  optional_addon: boolean;
  progression_marker: string;
};

export type PreviewSession = {
  day: string;
  slot: "am" | "pm" | "single";
  title: string;
  session_type: string;
  stress: PreviewStress;
  hyrox_pillar: HyroxPillar | null;
  purpose: string;
  progression_note: string;
  block_week_progression_note: string;
  rpe: string;
  duration_minutes: number;
  warm_up: string;
  main_set: string;
  cool_down: string;
  target_pace_guidance: string | null;
  target_erg_guidance: string | null;
  optional_addon: PreviewOptionalAddon | null;
  extra_round_rule: string | null;
  coach_support_note: string | null;
  is_optional_session: boolean;
  what_to_record: string;
  scaling: string;
  equipment_notes: string | null;
  weakness_focus: string[];
  metadata: PreviewSessionMetadata;
};

export type PreviewWeekMetrics = {
  week_in_block: number;
  progression_focus: string;
  total_planned_minutes: number;
  aerobic_minutes: number;
  threshold_minutes: number;
  strength_minutes: number;
  run_sessions: number;
  erg_sessions: number;
  hard_sessions: number;
  optional_addon_minutes: number;
};

export type PreviewWeek = {
  week_number: number;
  title: string;
  focus: string;
  progression_focus: string;
  sessions: PreviewSession[];
  metrics: PreviewWeekMetrics;
};

export type CommunityProgrammePreview = {
  track: CommunityTrainingTrack;
  block_number: number;
  block_phase: BlockPhase;
  block_phase_label: string;
  block_label: string;
  progression_focus: string;
  coach_support_note: string;
  weeks: PreviewWeek[];
  weakness_focus_block: string[];
  equipment_substitutions: string[];
  generated_at: string;
};

export type QaCheckStatus = "pass" | "warn" | "fail";

export type QaCheck = {
  status: QaCheckStatus;
  category: string;
  message: string;
};

export type CommunityPreviewQaReport = {
  checks: QaCheck[];
  pass_count: number;
  warn_count: number;
  fail_count: number;
};
