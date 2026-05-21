/**
 * Supabase Hyrox Team schema types (Phase 1).
 * Mirrors `supabase/migrations/001_hyrox_team_schema.sql`.
 * Not wired to UI yet — use for server actions, webhooks, and typed queries in later phases.
 */

export type HyroxJson = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

export type HyroxApplicationStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export type HyroxAthleteStatus =
  | "accepted"
  | "payment_confirmed"
  | "assessment_required"
  | "assessment_submitted"
  | "testing_required"
  | "testing_submitted"
  | "coach_reviewing"
  | "draft_generated"
  | "programme_published";

export type HyroxAthletePaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type HyroxAssessmentStatus = "draft" | "submitted";

export type HyroxTestingResultType =
  | "five_k_run"
  | "one_k_ski"
  | "two_k_row"
  | "mini_compromised"
  | "farmer_hold"
  | "sandbag_lunge_capacity"
  | "wall_ball_capacity"
  | "sled_exposure";

export type HyroxTestingResultStatus = "draft" | "submitted";

export type HyroxMappedProfileStatus = "mapped" | "coach_reviewed" | "superseded";

export type HyroxProgrammeDraftStatus =
  | "draft_generated"
  | "coach_reviewing"
  | "edited"
  | "approved"
  | "published"
  | "archived";

export type HyroxProgrammeWeekStatus = "draft" | "published" | "archived";

export type HyroxProgrammeSessionSlot = "AM" | "PM" | "Optional" | "Main";

export type HyroxProgrammeSessionStatus =
  | "scheduled"
  | "completed"
  | "missed"
  | "modified";

export type HyroxCheckInStatus = "due" | "submitted" | "reviewed";

export type HyroxCoachNoteType =
  | "profile_review"
  | "programme_note"
  | "check_in_response"
  | "video_feedback"
  | "race_prep"
  | "general";

export type HyroxPaymentLinkType = "monthly" | "twelve_week" | "sixteen_week";

export type HyroxPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

// ---------------------------------------------------------------------------
// Row shapes (Insert omits id/timestamps where DB defaults apply)
// ---------------------------------------------------------------------------

export type HyroxApplicationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  instagram_handle: string | null;
  phone: string | null;
  hyrox_experience: string | null;
  current_level: string | null;
  target_event: string | null;
  target_date: string | null;
  goal: string | null;
  reason_for_applying: string | null;
  documentation_interest: boolean;
  status: HyroxApplicationStatus;
  coach_notes: string | null;
  raw_payload?: HyroxJson | null;
};

export type HyroxApplicationInsert = Omit<
  HyroxApplicationRow,
  "id" | "created_at" | "updated_at" | "status" | "coach_notes"
> & {
  id?: string;
  status?: HyroxApplicationStatus;
  coach_notes?: string | null;
  raw_payload?: HyroxJson;
};

export type HyroxAthleteRow = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  status: HyroxAthleteStatus;
  race_name: string | null;
  race_date: string | null;
  race_category: string | null;
  target_time: string | null;
  current_block: number;
  current_week: number;
  programme_status: string;
  payment_status: HyroxAthletePaymentStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  coach_notes: string | null;
};

export type HyroxAthleteInsert = Omit<
  HyroxAthleteRow,
  "id" | "created_at" | "updated_at" | "current_block" | "current_week" | "programme_status" | "payment_status"
> & {
  id?: string;
  current_block?: number;
  current_week?: number;
  programme_status?: string;
  payment_status?: HyroxAthletePaymentStatus;
};

/** Coach roster list item with onboarding flags */
export type HyroxAthleteListItem = HyroxAthleteRow & {
  hasAssessment: boolean;
  hasTesting: boolean;
  hasRaceResult?: boolean;
  userLinked: boolean;
};

export type HyroxAssessmentRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  raw_answers: HyroxJson;
  training_days: number | null;
  weekly_training_hours: number | null;
  current_weekly_run_volume_km: number | null;
  five_k_time: string | null;
  ten_k_time: string | null;
  max_heart_rate: number | null;
  threshold_heart_rate: number | null;
  station_weaknesses: string[] | null;
  equipment_access: string[] | null;
  injury_flags: string[] | null;
  sleep_quality: string | null;
  stress_level: string | null;
  bodyweight: number | null;
  body_composition_goal: string | null;
  documentation_consent: boolean;
  status: HyroxAssessmentStatus;
};

export type HyroxAssessmentInsert = Omit<
  HyroxAssessmentRow,
  "id" | "created_at" | "updated_at" | "status" | "documentation_consent"
> & {
  id?: string;
  status?: HyroxAssessmentStatus;
  documentation_consent?: boolean;
};

export type HyroxTestingResultRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  test_type: HyroxTestingResultType;
  test_date: string | null;
  result: HyroxJson;
  rpe: number | null;
  notes: string | null;
  status: HyroxTestingResultStatus;
};

export type HyroxRaceResultRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  race_event: string;
  race_date: string | null;
  category: string | null;
  total_time: string | null;
  bodyweight: number | null;
  run_splits: HyroxJson | null;
  station_splits: HyroxJson | null;
  weakest_station: string | null;
  weakest_run: string | null;
  biggest_limiter: string | null;
  notes: string | null;
  roxfit_screenshot_url: string | null;
};

export type HyroxMappedProfileRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  mapped_profile: HyroxJson;
  coach_overrides: HyroxJson | null;
  effective_profile: HyroxJson;
  athlete_level: string | null;
  main_limiter: string | null;
  secondary_limiter: string | null;
  recovery_risk: string | null;
  double_session_readiness: string | null;
  first_block_focus: string | null;
  coach_review_flags: HyroxJson | null;
  status: HyroxMappedProfileStatus;
};

export type HyroxProgrammeDraftRow = {
  id: string;
  athlete_id: string;
  mapped_profile_id: string | null;
  created_at: string;
  updated_at: string;
  block_number: number;
  week_number: number;
  draft_data: HyroxJson;
  weekly_summary: HyroxJson | null;
  validation_warnings: HyroxJson | null;
  coach_note: string | null;
  athlete_facing_note: string | null;
  status: HyroxProgrammeDraftStatus;
  published_at: string | null;
};

export type HyroxProgrammeWeekRow = {
  id: string;
  athlete_id: string;
  source_draft_id: string | null;
  created_at: string;
  updated_at: string;
  block_number: number;
  week_number: number;
  week_start_date: string | null;
  week_end_date: string | null;
  weekly_focus: string | null;
  coach_note: string | null;
  athlete_facing_note: string | null;
  weekly_summary: HyroxJson | null;
  status: HyroxProgrammeWeekStatus;
  published_at: string;
};

export type HyroxProgrammeSessionRow = {
  id: string;
  programme_week_id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  day_of_week: string;
  session_slot: HyroxProgrammeSessionSlot;
  session_name: string;
  category: string;
  prescription: HyroxJson;
  metadata: HyroxJson | null;
  status: HyroxProgrammeSessionStatus;
  completed_at: string | null;
  athlete_feedback: HyroxJson | null;
};

export type HyroxCheckInRow = {
  id: string;
  athlete_id: string;
  programme_week_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  week_number: number | null;
  sleep: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  motivation: number | null;
  bodyweight: number | null;
  sessions_completed: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_niggles: string | null;
  next_week_availability: string | null;
  raw_answers: HyroxJson | null;
  coach_response: string | null;
  status: HyroxCheckInStatus;
};

export type HyroxCoachNoteRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  updated_at: string;
  note_type: HyroxCoachNoteType;
  title: string | null;
  body: string;
  visible_to_athlete: boolean;
  related_programme_week_id: string | null;
};

export type HyroxProgrammeStatusHistoryRow = {
  id: string;
  athlete_id: string;
  created_at: string;
  status_from: string | null;
  status_to: string;
  changed_by: string | null;
  reason: string | null;
  metadata: HyroxJson | null;
};

export type HyroxPaymentRow = {
  id: string;
  athlete_id: string | null;
  application_id: string | null;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_link_type: HyroxPaymentLinkType | null;
  amount: number | null;
  currency: string;
  status: HyroxPaymentStatus;
  raw_event: HyroxJson | null;
};

export type HyroxSessionLibraryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: string;
  subcategory: string | null;
  level: string | null;
  prescription: HyroxJson;
  metadata: HyroxJson | null;
  tags: string[] | null;
  is_staple: boolean;
  is_active: boolean;
  source: string | null;
};

// ---------------------------------------------------------------------------
// Table name map (for typed Supabase client extensions in Phase 2+)
// ---------------------------------------------------------------------------

export const HYROX_TABLES = {
  applications: "hyrox_applications",
  athletes: "hyrox_athletes",
  assessments: "hyrox_assessments",
  testingResults: "hyrox_testing_results",
  raceResults: "hyrox_race_results",
  mappedProfiles: "hyrox_mapped_profiles",
  programmeDrafts: "hyrox_programme_drafts",
  programmeWeeks: "hyrox_programme_weeks",
  programmeSessions: "hyrox_programme_sessions",
  checkIns: "hyrox_check_ins",
  coachNotes: "hyrox_coach_notes",
  programmeStatusHistory: "hyrox_programme_status_history",
  payments: "hyrox_payments",
  sessionLibrary: "hyrox_session_library",
} as const;

export type HyroxTableName = (typeof HYROX_TABLES)[keyof typeof HYROX_TABLES];

/** Map UI benchmark kinds → DB `test_type` (Phase 4 testing persistence). */
export const BENCHMARK_KIND_TO_DB_TEST_TYPE: Record<string, HyroxTestingResultType> = {
  run_5k: "five_k_run",
  erg_ski_1k: "one_k_ski",
  erg_row_2k: "two_k_row",
  mini_compromised: "mini_compromised",
  farmer_hold: "farmer_hold",
  sandbag_lunge: "sandbag_lunge_capacity",
  wall_ball: "wall_ball_capacity",
  sled_exposure: "sled_exposure",
};
