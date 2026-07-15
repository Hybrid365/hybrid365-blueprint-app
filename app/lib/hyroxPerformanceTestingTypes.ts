/**
 * Hybrid365 Performance Testing — typed schemas, field definitions and validation.
 */

export const PERFORMANCE_TEST_WEEK_ID = "test-week-1" as const;
export const PERFORMANCE_TEST_WEEK_LABEL = "Test Week 1";

export type PerformanceTestStatus = "not_started" | "draft" | "submitted" | "reviewed";

export type PerformanceTestType =
  | "five_k_run"
  | "recovery_day"
  | "mobility_technique"
  | "strength_assessment"
  | "ski_2k"
  | "row_2k"
  | "sled_push"
  | "sled_pull"
  | "wall_ball"
  | "farmers_carry"
  | "dead_hang"
  | "compromised_sled_run";

export const ALL_PERFORMANCE_TEST_TYPES: PerformanceTestType[] = [
  "five_k_run",
  "recovery_day",
  "mobility_technique",
  "strength_assessment",
  "ski_2k",
  "row_2k",
  "sled_push",
  "sled_pull",
  "wall_ball",
  "farmers_carry",
  "dead_hang",
  "compromised_sled_run",
];

export const STATION_DIAGNOSTIC_TYPES: PerformanceTestType[] = [
  "sled_push",
  "sled_pull",
  "wall_ball",
  "farmers_carry",
  "dead_hang",
];

export type PerformanceTestFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "url";

export type PerformanceTestFieldDef = {
  key: string;
  label: string;
  type: PerformanceTestFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
};

export type PerformanceTestDayDef = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  title: string;
  testTypes: PerformanceTestType[];
  timeOfDay?: "AM" | "PM" | "Main";
};

export const PERFORMANCE_TEST_WEEK_DAYS: PerformanceTestDayDef[] = [
  { day: "Mon", title: "5 km Run Test", testTypes: ["five_k_run"] },
  { day: "Tue", title: "Easy Recovery", testTypes: ["recovery_day"] },
  { day: "Wed", title: "Rest, Mobility and Technique", testTypes: ["mobility_technique"] },
  { day: "Thu", title: "Controlled Strength Assessment", testTypes: ["strength_assessment"] },
  { day: "Fri", title: "2 km SkiErg Test", testTypes: ["ski_2k"], timeOfDay: "AM" },
  { day: "Fri", title: "2 km RowErg Test", testTypes: ["row_2k"], timeOfDay: "PM" },
  {
    day: "Sat",
    title: "Station Diagnostics and Dead Hang",
    testTypes: STATION_DIAGNOSTIC_TYPES,
  },
  { day: "Sun", title: "Compromised Sled-Running Test", testTypes: ["compromised_sled_run"] },
];

export type FiveKRunResult = {
  totalTime: string;
  averagePace: string;
  kmSplits?: string;
  rpe: string;
  averageHr?: string;
  maxHr?: string;
  cadence?: string;
  routeOrTreadmill?: string;
  treadmillIncline?: string;
};

export type RecoveryDayResult = {
  completed: boolean;
  duration?: string;
  rpe?: string;
  soreness?: string;
  recoveryNotes?: string;
  averageHr?: string;
};

export type MobilityTechniqueResult = {
  completed: boolean;
  movementReviewed?: string;
  notes?: string;
};

export type StrengthAssessmentResult = {
  exercise: string;
  load: string;
  reps: string;
  rpe: string;
  bodyweight?: string;
  leftRightDifference?: string;
  techniqueQuality?: string;
  painOrRestriction?: string;
};

export type Erg2kResult = {
  totalTime: string;
  average500mSplit: string;
  averageWatts?: string;
  strokeRate?: string;
  first1kmSplit: string;
  second1kmSplit: string;
  rpe: string;
  averageHr?: string;
  maxHr?: string;
  techniqueNotes?: string;
};

export type SledPushResult = {
  distance: string;
  load: string;
  surface: string;
  totalTime: string;
  splits?: string;
  pauses?: string;
  limitation?: string;
};

export type SledPullResult = {
  distance: string;
  load: string;
  surface: string;
  totalTime: string;
  splits?: string;
  pauses?: string;
  limitation?: string;
};

export type WallBallResult = {
  repTarget: string;
  totalTime: string;
  setBreakdown?: string;
  longestUnbrokenSet?: string;
  missedReps?: string;
  primaryLimitation?: string;
  rpe?: string;
};

export type FarmersCarryResult = {
  distance: string;
  totalTime: string;
  drops?: string;
  gripPostureLimitation?: string;
};

export type DeadHangResult = {
  totalSeconds: string;
  bodyweight?: string;
  limitation: string;
  rpe?: string;
};

export type CompromisedRoundResult = {
  roundNumber: number;
  runSplit: string;
  sledPushSplit: string;
  sledPullSplit: string;
  burpeeResult: string;
  totalRoundTime: string;
  recoveryDuration?: string;
  rpe?: string;
};

export type CompromisedSledRunResult = {
  rounds: CompromisedRoundResult[];
  overallRpe: string;
  weakestComponent?: string;
  runPaceDeterioration?: string;
  techniqueBreakdown?: string;
  averageHr?: string;
  maxHr?: string;
};

export type PerformanceTestDefinition = {
  testType: PerformanceTestType;
  title: string;
  purpose: string;
  protocol: string[];
  scalingNotes: string[];
  requiredFields: PerformanceTestFieldDef[];
  optionalFields: PerformanceTestFieldDef[];
  videoPrompt?: string;
  coachNote?: string;
  safetyNote?: string;
  stressLevel: string;
  estimatedDuration: string;
};

const RPE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const DEAD_HANG_LIMITATIONS = [
  { value: "fingers", label: "Fingers" },
  { value: "forearms", label: "Forearms" },
  { value: "shoulders", label: "Shoulders" },
  { value: "general_fatigue", label: "General fatigue" },
];

export const PERFORMANCE_TEST_DEFINITIONS: Record<PerformanceTestType, PerformanceTestDefinition> = {
  five_k_run: {
    testType: "five_k_run",
    title: "5 km Run Test",
    purpose:
      "Establish current running performance and create a reference point for threshold, tempo and race-pace prescriptions.",
    protocol: [
      "15–20 min easy warm-up with running drills",
      "4 × 20 sec progressive strides",
      "5 km best sustainable effort",
      "10–15 min easy cool-down",
    ],
    scalingNotes: [
      "Beginner alternative: 20-minute best sustainable run — record total distance instead of 5 km time.",
    ],
    requiredFields: [
      { key: "totalTime", label: "Total time", type: "text", required: true, placeholder: "e.g. 22:45" },
      { key: "averagePace", label: "Average pace", type: "text", required: true, placeholder: "e.g. 4:33/km" },
      { key: "kmSplits", label: "1 km splits (if available)", type: "textarea", placeholder: "One split per line" },
      { key: "rpe", label: "RPE", type: "select", required: true, options: RPE_OPTIONS },
    ],
    optionalFields: [
      { key: "averageHr", label: "Average HR", type: "text" },
      { key: "maxHr", label: "Maximum HR", type: "text" },
      { key: "cadence", label: "Cadence", type: "text" },
      { key: "routeOrTreadmill", label: "Route / treadmill", type: "text" },
      { key: "treadmillIncline", label: "Treadmill incline", type: "text" },
    ],
    videoPrompt:
      "If possible, record a short clip from the side and front during the warm-up or test. This can help your coach review posture, cadence and running mechanics.",
    stressLevel: "High",
    estimatedDuration: "50–70 min",
  },
  recovery_day: {
    testType: "recovery_day",
    title: "Easy Recovery",
    purpose: "Recover from the run test and avoid carrying unnecessary fatigue into later assessments.",
    protocol: [
      "30–60 min Zone 1/2 Bike, SkiErg, RowErg or easy mixed aerobic work",
      "Mobility work",
      "No maximal efforts",
    ],
    scalingNotes: ["Keep effort genuinely easy — this day supports test quality later in the week."],
    requiredFields: [
      { key: "completed", label: "Completed", type: "boolean", required: true },
      { key: "duration", label: "Duration", type: "text", required: true, placeholder: "e.g. 45 min" },
      { key: "rpe", label: "RPE", type: "select", required: true, options: RPE_OPTIONS },
      { key: "soreness", label: "Soreness", type: "text", required: true },
      { key: "recoveryNotes", label: "Recovery notes", type: "textarea", required: true },
    ],
    optionalFields: [{ key: "averageHr", label: "Average HR", type: "text" }],
    stressLevel: "Low",
    estimatedDuration: "30–60 min",
  },
  mobility_technique: {
    testType: "mobility_technique",
    title: "Rest, Mobility and Technique",
    purpose: "Create a lower-stress day before strength and erg testing.",
    protocol: [
      "Full rest, or 20–40 min very easy aerobic work",
      "Ankle, hip and thoracic mobility",
      "Wall-ball and sled technique practice if available",
      "Light movement practice only",
    ],
    scalingNotes: ["No maximal efforts — technique and movement quality only."],
    requiredFields: [
      { key: "completed", label: "Completed", type: "boolean", required: true },
      { key: "movementReviewed", label: "Movement reviewed / requested", type: "text" },
    ],
    optionalFields: [{ key: "notes", label: "Notes", type: "textarea" }],
    videoPrompt:
      "Use this day to record any movement you want reviewed, including running mechanics, wall balls, lunges, sled technique or burpee broad jumps.",
    stressLevel: "Very low",
    estimatedDuration: "20–40 min or rest",
  },
  strength_assessment: {
    testType: "strength_assessment",
    title: "Controlled Strength Assessment",
    purpose: "Assess strength safely without creating excessive soreness or injury risk.",
    protocol: [
      "Primary lower-body: back squat, trap-bar deadlift or hack squat — controlled 3–5RM or 6–8RM",
      "Single-leg: reverse lunge or Bulgarian split squat — 6–8 reps per side",
      "Optional upper: strict or weighted pull-ups, controlled press benchmark",
    ],
    scalingNotes: [
      "Work to approximately 90% of current capability — leave 1–2 reps in reserve.",
      "Do not perform failed reps or unsafe grinders.",
    ],
    requiredFields: [
      { key: "exercise", label: "Exercise", type: "text", required: true },
      { key: "load", label: "Load", type: "text", required: true },
      { key: "reps", label: "Reps", type: "text", required: true },
      { key: "rpe", label: "RPE", type: "select", required: true, options: RPE_OPTIONS },
    ],
    optionalFields: [
      { key: "bodyweight", label: "Bodyweight", type: "text" },
      { key: "leftRightDifference", label: "Left / right difference", type: "text" },
      { key: "techniqueQuality", label: "Technique quality", type: "text" },
      { key: "painOrRestriction", label: "Pain or restriction", type: "text" },
    ],
    safetyNote:
      "This is not a true maximum-strength test. Work to approximately 90% of your current capability, leaving around 1–2 reps in reserve. Do not perform failed reps or unsafe grinders.",
    videoPrompt:
      "Record your heaviest controlled working set from a useful side or 45-degree angle where possible.",
    stressLevel: "Moderate",
    estimatedDuration: "45–60 min",
  },
  ski_2k: {
    testType: "ski_2k",
    title: "2 km SkiErg Test",
    purpose: "Establish sustainable erg performance and create training pace targets.",
    protocol: ["Full warm-up on SkiErg", "2 km best sustainable effort", "Cool-down"],
    scalingNotes: ["Start controlled — avoid an overly aggressive first 500 m."],
    requiredFields: [
      { key: "totalTime", label: "Total time", type: "text", required: true },
      { key: "average500mSplit", label: "Average 500 m split", type: "text", required: true },
      { key: "first1kmSplit", label: "First 1 km split", type: "text", required: true },
      { key: "second1kmSplit", label: "Second 1 km split", type: "text", required: true },
      { key: "rpe", label: "RPE", type: "select", required: true, options: RPE_OPTIONS },
    ],
    optionalFields: [
      { key: "averageWatts", label: "Average watts", type: "text" },
      { key: "strokeRate", label: "Stroke rate", type: "text" },
      { key: "averageHr", label: "Average HR", type: "text" },
      { key: "maxHr", label: "Maximum HR", type: "text" },
      { key: "techniqueNotes", label: "Technique notes", type: "textarea" },
    ],
    coachNote: "Start controlled. Avoid ruining the test with an overly aggressive first 500 m.",
    stressLevel: "High",
    estimatedDuration: "30–45 min",
  },
  row_2k: {
    testType: "row_2k",
    title: "2 km RowErg Test",
    purpose: "Establish sustainable erg performance and create training pace targets.",
    protocol: ["Full warm-up on RowErg", "2 km best sustainable effort", "Cool-down"],
    scalingNotes: [
      "If AM SkiErg was completed, allow substantial recovery before this test.",
      "Do not perform SkiErg and RowErg back-to-back without full recovery.",
    ],
    requiredFields: [
      { key: "totalTime", label: "Total time", type: "text", required: true },
      { key: "average500mSplit", label: "Average 500 m split", type: "text", required: true },
      { key: "first1kmSplit", label: "First 1 km split", type: "text", required: true },
      { key: "second1kmSplit", label: "Second 1 km split", type: "text", required: true },
      { key: "rpe", label: "RPE", type: "select", required: true, options: RPE_OPTIONS },
    ],
    optionalFields: [
      { key: "averageWatts", label: "Average watts", type: "text" },
      { key: "strokeRate", label: "Stroke rate", type: "text" },
      { key: "averageHr", label: "Average HR", type: "text" },
      { key: "maxHr", label: "Maximum HR", type: "text" },
      { key: "techniqueNotes", label: "Technique notes", type: "textarea" },
    ],
    coachNote: "Start controlled. Avoid compromising the result with an overly aggressive first 500 m.",
    stressLevel: "High",
    estimatedDuration: "30–45 min",
  },
  sled_push: {
    testType: "sled_push",
    title: "Sled Push Assessment",
    purpose: "Assess sled push ability with standardised conditions.",
    protocol: ["Standardised distance, load and surface as prescribed by your coach."],
    scalingNotes: [
      "Sled results should only be compared when the same sled, surface, load, footwear, lane and distance are used.",
    ],
    requiredFields: [
      { key: "distance", label: "Distance", type: "text", required: true },
      { key: "load", label: "Load", type: "text", required: true },
      { key: "surface", label: "Surface", type: "text", required: true },
      { key: "totalTime", label: "Total time", type: "text", required: true },
    ],
    optionalFields: [
      { key: "splits", label: "Splits", type: "text" },
      { key: "pauses", label: "Pauses", type: "text" },
      { key: "limitation", label: "Primary limitation", type: "text" },
    ],
    videoPrompt: "Record short clips of sled technique where possible.",
    stressLevel: "Moderate–high",
    estimatedDuration: "15–25 min",
  },
  sled_pull: {
    testType: "sled_pull",
    title: "Sled Pull Assessment",
    purpose: "Assess sled pull ability with standardised conditions.",
    protocol: ["Standardised distance, load and surface as prescribed by your coach."],
    scalingNotes: [
      "Sled results should only be compared when the same sled, surface, load, footwear, lane and distance are used.",
    ],
    requiredFields: [
      { key: "distance", label: "Distance", type: "text", required: true },
      { key: "load", label: "Load", type: "text", required: true },
      { key: "surface", label: "Surface", type: "text", required: true },
      { key: "totalTime", label: "Total time", type: "text", required: true },
    ],
    optionalFields: [
      { key: "splits", label: "Splits", type: "text" },
      { key: "pauses", label: "Pauses", type: "text" },
      { key: "limitation", label: "Primary limitation", type: "text" },
    ],
    videoPrompt: "Record short clips of sled technique where possible.",
    stressLevel: "Moderate–high",
    estimatedDuration: "15–25 min",
  },
  wall_ball: {
    testType: "wall_ball",
    title: "Wall-Ball Durability",
    purpose: "Assess wall-ball pacing and durability under fatigue.",
    protocol: ["75 wall balls for time (default) or 50 for beginners."],
    scalingNotes: ["Record set breakdown and longest unbroken set."],
    requiredFields: [
      { key: "repTarget", label: "Rep target", type: "text", required: true, placeholder: "75 or 50" },
      { key: "totalTime", label: "Total time", type: "text", required: true },
    ],
    optionalFields: [
      { key: "setBreakdown", label: "Set breakdown", type: "textarea" },
      { key: "longestUnbrokenSet", label: "Longest unbroken set", type: "text" },
      { key: "missedReps", label: "Missed reps", type: "text" },
      { key: "primaryLimitation", label: "Primary limitation", type: "text" },
      { key: "rpe", label: "RPE", type: "select", options: RPE_OPTIONS },
    ],
    videoPrompt: "Record wall-ball technique where possible.",
    stressLevel: "Moderate–high",
    estimatedDuration: "10–20 min",
  },
  farmers_carry: {
    testType: "farmers_carry",
    title: "Farmer's Carry",
    purpose: "Assess grip endurance and carry posture under load.",
    protocol: ["200 m for time (default)."],
    scalingNotes: ["Record drops and grip/posture limitations."],
    requiredFields: [
      { key: "distance", label: "Distance", type: "text", required: true, placeholder: "200 m" },
      { key: "totalTime", label: "Total time", type: "text", required: true },
    ],
    optionalFields: [
      { key: "drops", label: "Drops", type: "text" },
      { key: "gripPostureLimitation", label: "Grip / posture limitation", type: "text" },
    ],
    stressLevel: "Moderate",
    estimatedDuration: "10–15 min",
  },
  dead_hang: {
    testType: "dead_hang",
    title: "Dead Hang Test",
    purpose: "Assess grip endurance with active shoulder position.",
    protocol: [
      "Double-overhand grip, no straps",
      "Active shoulder position",
      "Timer starts when feet leave the floor",
      "Stop when grip or position fails",
    ],
    scalingNotes: ["Record bodyweight and primary limitation."],
    requiredFields: [
      { key: "totalSeconds", label: "Total hang time (seconds)", type: "text", required: true },
      {
        key: "limitation",
        label: "Primary limitation",
        type: "select",
        required: true,
        options: DEAD_HANG_LIMITATIONS,
      },
    ],
    optionalFields: [
      { key: "bodyweight", label: "Bodyweight", type: "text" },
      { key: "rpe", label: "RPE", type: "select", options: RPE_OPTIONS },
    ],
    stressLevel: "Low–moderate",
    estimatedDuration: "5–10 min",
  },
  compromised_sled_run: {
    testType: "compromised_sled_run",
    title: "Compromised Sled-Running Test",
    purpose: "Measure how well you return to running after heavy stations.",
    protocol: [
      "3 rounds (default): 800 m run, 25 m sled push, 25 m sled pull, 10 burpee broad jumps",
      "2–3 min recovery between rounds",
      "Advanced: 4 rounds with shorter recovery where appropriate",
      "Beginner: 500–600 m run, reduced sled distance/load, 6–8 burpee broad jumps",
    ],
    scalingNotes: ["Record every run split and round RPE."],
    requiredFields: [
      { key: "overallRpe", label: "Overall RPE", type: "select", required: true, options: RPE_OPTIONS },
    ],
    optionalFields: [
      { key: "weakestComponent", label: "Weakest component", type: "text" },
      { key: "runPaceDeterioration", label: "Run pace deterioration", type: "text" },
      { key: "techniqueBreakdown", label: "Technique breakdown", type: "textarea" },
      { key: "averageHr", label: "Average HR", type: "text" },
      { key: "maxHr", label: "Maximum HR", type: "text" },
    ],
    videoPrompt: "Record clips if technique breakdown is a concern.",
    stressLevel: "Very high",
    estimatedDuration: "45–70 min",
  },
};

export type PerformanceTestResultRow = {
  id: string;
  athlete_id: string;
  programme_week_id: string | null;
  test_week_id: string;
  test_type: string;
  test_date: string | null;
  status: PerformanceTestStatus;
  result_json: Record<string, unknown>;
  notes: string | null;
  video_url: string | null;
  proof_url: string | null;
  coach_reviewed: boolean;
  coach_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoveryBaselineRow = {
  id: string;
  athlete_id: string;
  test_week_id: string;
  resting_hr_baseline: number;
  baseline_days: number;
  average_hrv: number | null;
  average_sleep_minutes: number | null;
  average_daily_steps: number | null;
  average_training_hours: number | null;
  device_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return !Number.isNaN(value);
  return String(value).trim().length > 0;
}

export function validatePerformanceTestResult(
  testType: PerformanceTestType,
  resultJson: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const def = PERFORMANCE_TEST_DEFINITIONS[testType];
  const errors: string[] = [];

  for (const field of def.requiredFields) {
    if (!field.required) continue;
    if (field.type === "boolean") {
      if (typeof resultJson[field.key] !== "boolean") {
        errors.push(`${field.label} is required.`);
      }
      continue;
    }
    if (!isNonEmpty(resultJson[field.key])) {
      errors.push(`${field.label} is required.`);
    }
  }

  if (testType === "compromised_sled_run") {
    const rounds = resultJson.rounds;
    if (!Array.isArray(rounds) || rounds.length === 0) {
      errors.push("At least one round result is required.");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function performanceTestTypeLabel(testType: PerformanceTestType): string {
  return PERFORMANCE_TEST_DEFINITIONS[testType]?.title ?? testType;
}

export function statusLabel(status: PerformanceTestStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "draft":
      return "Draft saved";
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Coach reviewed";
    default:
      return status;
  }
}

export const WHY_WE_TEST_CARDS = [
  {
    title: "Establish your baseline",
    body: "Record where your fitness and HYROX performance currently stand.",
  },
  {
    title: "Prescribe accurate intensities",
    body: "Use real test results to guide running, SkiErg and RowErg training targets.",
  },
  {
    title: "Identify your limiters",
    body: "Understand whether running, engine, strength, grip, stations or compromised running need the greatest focus.",
  },
  {
    title: "Track progression",
    body: "Repeat key tests later in the season and compare your development.",
  },
  {
    title: "Build a more specific programme",
    body: "Your future blocks can place greater emphasis on the areas that will make the biggest difference.",
  },
] as const;

export const PERFORMANCE_TEST_INTRO =
  "This testing week gives us a clear picture of your current running, engine, strength, station performance and ability to run after fatigue. Your results establish accurate baselines, help us prescribe more specific training targets and allow us to track progress throughout the season.";

export const RECOVERY_BASELINE_COPY =
  "Your normal recovery data gives context to future check-ins. A single number is never used in isolation; trends are considered alongside sleep, soreness, fatigue, motivation and illness.";

export const DEFAULT_COMPROMISED_ROUNDS = 3;

export function emptyCompromisedRound(roundNumber: number): CompromisedRoundResult {
  return {
    roundNumber,
    runSplit: "",
    sledPushSplit: "",
    sledPullSplit: "",
    burpeeResult: "",
    totalRoundTime: "",
    recoveryDuration: "",
    rpe: "",
  };
}

export function defaultResultJsonForType(testType: PerformanceTestType): Record<string, unknown> {
  if (testType === "compromised_sled_run") {
    return {
      rounds: Array.from({ length: DEFAULT_COMPROMISED_ROUNDS }, (_, i) =>
        emptyCompromisedRound(i + 1)
      ),
      overallRpe: "",
    };
  }
  if (testType === "recovery_day" || testType === "mobility_technique") {
    return { completed: false };
  }
  return {};
}
