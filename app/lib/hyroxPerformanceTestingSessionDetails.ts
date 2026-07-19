/**
 * Canonical athlete-facing session details for Hybrid365 Performance Testing (V2).
 * Maps onto ResolvedSessionPrescription so Programme Builder View and athlete SessionDrawer render.
 */

import type { ResolvedSessionPrescription } from "@/src/lib/hyrox/types";
import {
  COMPROMISED_HYROX_PACING_GUIDANCE,
  type PerformanceTestType,
} from "@/app/lib/hyroxPerformanceTestingTypes";

export type PerformanceTestingDetailKey =
  | PerformanceTestType
  | "saturday_recovery";

export type PerformanceTestingSessionDetailSource = {
  title: string;
  purpose: string;
  duration: string;
  durationMinutes: number;
  equipment: string[];
  warmup: string[];
  mainSet: string[];
  cooldown: string[];
  whatToRecord: string[];
  scaling: string[];
  coachNote: string;
  safetyNote: string;
  filmPrompt?: string;
  pacingNote?: string;
  rpeTarget: string;
  hardDay: boolean;
};

const DIVIDER = "—";

export const HYBRID365_COMPROMISED_HYROX_SEQUENCE_V2 =
  "HYBRID365_COMPROMISED_HYROX_SEQUENCE_V2" as const;

/** Required station markers used to detect an incomplete Sunday main set. */
export const COMPROMISED_HYROX_SEQUENCE_REQUIRED_MARKERS = [
  "1,000m SkiErg",
  "50m Sled Push",
  "50m Sled Pull",
  "40m Burpee Broad Jumps",
  "1,000m RowErg",
  "100m Farmer",
  "50m Sandbag Lunges",
  "50 Wall Balls",
] as const;

/** Canonical ordered movement block inserted into Sunday mainSet (idempotent via marker). */
export const COMPROMISED_HYROX_SEQUENCE_MAIN_SET_BLOCK: string[] = [
  HYBRID365_COMPROMISED_HYROX_SEQUENCE_V2,
  "Full ordered test",
  DIVIDER,
  "STANDARD — 600M RUNS",
  "1. 600m Run",
  "2. 1,000m SkiErg",
  "3. 600m Run",
  "4. 50m Sled Push",
  "5. 600m Run",
  "6. 50m Sled Pull",
  "7. 600m Run",
  "8. 40m Burpee Broad Jumps",
  "9. 600m Run",
  "10. 1,000m RowErg",
  "11. 600m Run",
  "12. 100m Farmer’s Carry",
  "13. 600m Run",
  "14. 50m Sandbag Lunges",
  "15. 600m Run",
  "16. 50 Wall Balls",
  "Total running: 4.8km",
  DIVIDER,
  "ADVANCED — 800M RUNS",
  "Use the same station order and station volumes, replacing every 600m run with 800m.",
  "1. 800m Run",
  "2. 1,000m SkiErg",
  "3. 800m Run",
  "4. 50m Sled Push",
  "5. 800m Run",
  "6. 50m Sled Pull",
  "7. 800m Run",
  "8. 40m Burpee Broad Jumps",
  "9. 800m Run",
  "10. 1,000m RowErg",
  "11. 800m Run",
  "12. 100m Farmer’s Carry",
  "13. 800m Run",
  "14. 50m Sandbag Lunges",
  "15. 800m Run",
  "16. 50 Wall Balls",
  "Total running: 6.4km",
  DIVIDER,
  "SCALED / CUSTOM",
  "Use the coach-approved run distances, station volumes and equipment loads recorded for the athlete.",
  "Record the exact scaled protocol on the Performance Testing result form.",
];

export function mainSetHasCompromisedHyroxSequence(lines: string[] | null | undefined): boolean {
  if (!lines?.length) return false;
  const joined = lines.join("\n");
  if (joined.includes(HYBRID365_COMPROMISED_HYROX_SEQUENCE_V2)) return true;
  return COMPROMISED_HYROX_SEQUENCE_REQUIRED_MARKERS.every((marker) =>
    lines.some((line) => line.includes(marker))
  );
}

/**
 * Append the canonical Sunday sequence when absent.
 * Preserves existing coach/guidance lines and does not duplicate the block.
 */
export function mergeCompromisedHyroxSequenceIntoMainSet(existing: string[]): string[] {
  if (mainSetHasCompromisedHyroxSequence(existing)) {
    return existing;
  }
  const trimmed = existing.map((l) => l.trimEnd()).filter((l, i, arr) => {
    if (i < arr.length - 1) return true;
    return l.trim().length > 0;
  });
  if (trimmed.length === 0) {
    return [...COMPROMISED_HYROX_SEQUENCE_MAIN_SET_BLOCK];
  }
  const needsDivider = trimmed[trimmed.length - 1] !== DIVIDER;
  return [
    ...trimmed,
    ...(needsDivider ? [DIVIDER] : []),
    ...COMPROMISED_HYROX_SEQUENCE_MAIN_SET_BLOCK,
  ];
}

export const PERFORMANCE_TESTING_SESSION_DETAILS: Record<
  PerformanceTestingDetailKey,
  PerformanceTestingSessionDetailSource
> = {
  five_k_run: {
    title: "5km Run Performance Test",
    purpose:
      "Establish current fresh running ability and create reference points for future easy, threshold, tempo and HYROX running prescriptions.",
    duration: "45–60 minutes",
    durationMinutes: 55,
    equipment: [
      "Running watch or timing device",
      "Flat measured route, track or treadmill",
      "Heart-rate monitor optional",
    ],
    warmup: [
      "15–20 minutes easy running",
      "Running drills and mobility",
      "4 × 20-second progressive strides",
      "60–90 seconds easy recovery between strides",
      "2–3 minutes easy movement before starting",
    ],
    mainSet: [
      "Equipment",
      "Running watch or timing device",
      "Flat measured route, track or treadmill",
      "Heart-rate monitor optional",
      DIVIDER,
      "Main test",
      "Complete 5km at the fastest pace you can sustain evenly",
      "Avoid sprinting the opening kilometre",
      "Aim for controlled early splits and the strongest possible finish",
      "Record all kilometre splits",
    ],
    cooldown: [
      "10–15 minutes very easy running or walking",
      "Light mobility",
    ],
    whatToRecord: [
      "Total time",
      "Average pace",
      "1km splits",
      "RPE",
      "Average HR (optional)",
      "Maximum HR (optional)",
      "Route, track or treadmill details",
      "Notes",
      "Proof or video (optional)",
    ],
    scaling: [
      "Beginner athletes may complete a 20-minute best sustainable run and record total distance, but only when selected by the coach.",
    ],
    coachNote:
      "Enter your formal result on the Performance Testing page after the session. Keep early splits controlled.",
    safetyNote:
      "This is a hard effort. Warm up fully. Stop if pain (not effort) appears. Beginner distance alternative only when coach-selected.",
    filmPrompt:
      "Optional: short side and front clips during warm-up or early kilometres for running-mechanics review.",
    rpeTarget: "8–9",
    hardDay: true,
  },

  recovery_day: {
    title: "Easy Aerobic Recovery",
    purpose:
      "Recover from Monday’s run test while maintaining light aerobic movement.",
    duration: "30–60 minutes",
    durationMinutes: 45,
    equipment: ["Bike, SkiErg, RowErg, or space to walk", "Mat for mobility"],
    warmup: ["Optional 3–5 minutes easy movement to settle in"],
    mainSet: [
      "Options (choose one or mix)",
      "Easy bike",
      "Easy SkiErg",
      "Easy RowErg",
      "Mixed low-intensity aerobic work",
      "Walking and mobility",
      DIVIDER,
      "Intensity",
      "Zone 1 to low Zone 2",
      "Conversational effort",
      "RPE 2–4",
      "No intervals or hard station work",
      DIVIDER,
      "Mobility",
      "Ankles, calves, hips, thoracic spine",
      "Any individual restriction",
    ],
    cooldown: ["Finish with light mobility if not already completed"],
    whatToRecord: [
      "Duration",
      "RPE",
      "Average HR (optional)",
      "Soreness",
      "Recovery notes",
    ],
    scaling: ["Keep effort genuinely easy — this day protects later test quality."],
    coachNote:
      "Log completion via your programme session. No formal Performance Testing result form is required for this day.",
    safetyNote: "No hard efforts. Stop well before fatigue.",
    rpeTarget: "2–4",
    hardDay: false,
  },

  mobility_technique: {
    title: "Rest, Mobility and Technique",
    purpose:
      "Reduce fatigue before the erg and strength assessments while improving movement quality.",
    duration: "20–40 minutes or rest",
    durationMinutes: 30,
    equipment: ["Mat", "Optional light wall ball / sled access for technique only"],
    warmup: ["Optional 5 minutes very easy aerobic movement if not resting fully"],
    mainSet: [
      "Options",
      "Complete rest",
      "20–30 minutes very easy aerobic recovery",
      "Mobility",
      "Light technical practice only",
      DIVIDER,
      "Optional technique work (film if useful)",
      "Running mechanics",
      "Wall-ball positioning",
      "Sled body position",
      "Lunge mechanics",
      "Burpee broad-jump rhythm",
      "SkiErg technique",
      "RowErg technique",
      DIVIDER,
      "Instructions",
      "Do not turn this into a workout",
      "Stop well before fatigue",
      "Athletes may film short movement clips for coach review",
    ],
    cooldown: ["None required if resting; otherwise light stretch"],
    whatToRecord: [
      "Completed (yes/no)",
      "Movements reviewed or filmed",
      "Notes",
    ],
    scaling: ["Full rest is a valid choice."],
    coachNote:
      "No formal Performance Testing result form is required. Use this day for quality, not fatigue.",
    safetyNote: "Technique and mobility only — no maximal efforts.",
    filmPrompt:
      "Optional short clips of running mechanics, wall balls, lunges, sled technique or burpee broad jumps.",
    rpeTarget: "1–3",
    hardDay: false,
  },

  ski_2k: {
    title: "2km SkiErg Performance Test",
    purpose:
      "Establish fresh SkiErg capacity, pacing ability and future training split references.",
    duration: "35–50 minutes",
    durationMinutes: 45,
    equipment: ["SkiErg", "Timing display", "Heart-rate monitor optional"],
    warmup: [
      "8–12 minutes easy SkiErg",
      "Mobility for shoulders, lats, trunk and hips",
      "3 × 30 seconds progressively faster",
      "60–90 seconds easy between efforts",
      "2–3 minutes easy movement before starting",
    ],
    mainSet: [
      "Main test",
      "Complete 2,000m at the fastest sustainable pace",
      "Start controlled",
      "Do not ruin the test by over-pacing the opening 500m",
      "Aim to maintain or improve the split across the second kilometre",
      DIVIDER,
      "Thursday scheduling",
      "AM SkiErg and PM RowErg should ideally be separated by several hours",
      "Include food, hydration and recovery between tests",
    ],
    cooldown: ["8–10 minutes easy SkiErg or mixed aerobic work"],
    whatToRecord: [
      "Total time",
      "Average 500m split",
      "Average watts",
      "Stroke rate",
      "First 1km split",
      "Second 1km split",
      "RPE",
      "Average HR (optional)",
      "Maximum HR (optional)",
      "Technique notes",
      "Proof or video (optional)",
    ],
    scaling: ["Start controlled — best sustainable 2km, not a first-500m sprint."],
    coachNote:
      "Enter the formal result on the Performance Testing page. Protect the second kilometre.",
    safetyNote: "Warm up fully. Controlled sustainable effort.",
    filmPrompt: "Optional short technique clip from the side if form is a concern.",
    rpeTarget: "8–9",
    hardDay: true,
  },

  row_2k: {
    title: "2km RowErg Performance Test",
    purpose:
      "Establish fresh RowErg capacity, pacing ability and future training split references.",
    duration: "35–50 minutes",
    durationMinutes: 45,
    equipment: ["RowErg", "Timing display", "Heart-rate monitor optional"],
    warmup: [
      "8–12 minutes easy RowErg",
      "Mobility for hips, hamstrings, trunk and shoulders",
      "3 × 30 seconds progressively faster",
      "60–90 seconds easy between efforts",
      "2–3 minutes easy movement before starting",
    ],
    mainSet: [
      "Main test",
      "Complete 2,000m at the fastest sustainable pace",
      "Start controlled",
      "Avoid an unsustainable first 500m",
      "Maintain effective stroke length and posture as fatigue increases",
      DIVIDER,
      "Thursday scheduling",
      "Allow several hours after the AM SkiErg test before starting",
      "Prioritise food, hydration and recovery between AM and PM",
    ],
    cooldown: ["8–10 minutes easy rowing or mixed aerobic work"],
    whatToRecord: [
      "Total time",
      "Average 500m split",
      "Average watts",
      "Stroke rate",
      "First 1km split",
      "Second 1km split",
      "RPE",
      "Average HR (optional)",
      "Maximum HR (optional)",
      "Technique notes",
      "Proof or video (optional)",
    ],
    scaling: ["Do not perform SkiErg and RowErg back-to-back without full recovery."],
    coachNote:
      "Enter the formal result on the Performance Testing page after the session.",
    safetyNote: "Controlled sustainable effort. Separate clearly from the morning SkiErg test.",
    filmPrompt: "Optional short technique clip if posture or stroke length breaks down.",
    rpeTarget: "8–9",
    hardDay: true,
  },

  strength_assessment: {
    title: "Controlled Strength Assessment",
    purpose:
      "Assess usable strength and movement quality without creating excessive soreness before Sunday’s HYROX benchmark.",
    duration: "50–75 minutes",
    durationMinutes: 60,
    equipment: [
      "Barbell / trap bar / hack squat as selected",
      "Dumbbells or rack for single-leg work",
      "Optional pull-up bar / press setup",
    ],
    warmup: [
      "8–12 minutes easy aerobic work",
      "Dynamic lower-body mobility",
      "Movement-specific warm-up sets",
      "Gradually increase load without accumulating unnecessary fatigue",
    ],
    mainSet: [
      "Important rules",
      "This is not a true one-repetition maximum test",
      "Work to approximately 90% of current capability",
      "Leave 1–2 repetitions in reserve",
      "No failed repetitions",
      "No unsafe grinders",
      "Technique must remain controlled",
      "Avoid high-volume accessory work",
      DIVIDER,
      "Primary lower-body assessment — coach selects one",
      "Back squat: controlled 3–5RM",
      "Trap-bar deadlift: controlled 3–5RM",
      "Hack squat: controlled 6–8RM",
      DIVIDER,
      "Single-leg assessment — coach selects one",
      "Reverse lunge: controlled 6–8 reps each side",
      "Bulgarian split squat: controlled 6–8 reps each side",
      DIVIDER,
      "Optional upper-body benchmark",
      "Strict pull-ups",
      "Weighted pull-ups",
      "Controlled pressing benchmark",
      DIVIDER,
      "Rest guidance",
      "2–4 minutes between meaningful working sets",
      "Longer if needed to maintain technique",
    ],
    cooldown: ["Easy flush 5–8 minutes", "Light mobility for hips and thoracic spine"],
    whatToRecord: [
      "Exercise",
      "Load",
      "Repetitions",
      "RPE",
      "Bodyweight",
      "Left/right difference",
      "Technique quality",
      "Pain or restriction",
      "Notes",
      "Video of the heaviest controlled set (optional)",
    ],
    scaling: [
      "Reduce load rather than grinding. Leave 1–2 reps in reserve on every working set.",
    ],
    coachNote:
      "Enter the formal strength result on the Performance Testing page. Keep volume controlled ahead of Sunday.",
    safetyNote:
      "Not a true 1RM test. No failed reps or unsafe grinders. Stop if technique or pain deteriorates.",
    filmPrompt: "Record your heaviest controlled working set from a useful side or 45-degree angle where possible.",
    rpeTarget: "7–8",
    hardDay: true,
  },

  saturday_recovery: {
    title: "Recovery and HYROX Benchmark Preparation",
    purpose:
      "Reduce residual fatigue and prepare physically and mentally for Sunday’s continuous benchmark.",
    duration: "Rest or 20–40 minutes",
    durationMinutes: 30,
    equipment: ["Optional bike", "Mat for mobility"],
    warmup: ["Optional 3–5 minutes easy movement if choosing light aerobic work"],
    mainSet: [
      "Options",
      "Complete rest",
      "20–40 minutes very easy bike or mixed aerobic work",
      "Light mobility",
      "Very light movement rehearsal",
      DIVIDER,
      "Instructions",
      "No hard running",
      "No sled loading",
      "No high-volume lunges",
      "No hard wall balls",
      "No fatiguing erg intervals",
      "Finish feeling fresher than when you started",
      "Prepare equipment, weights, route and timing method for Sunday",
    ],
    cooldown: ["Light mobility if not already completed"],
    whatToRecord: ["Completed (optional)", "Duration if trained", "RPE", "Notes"],
    scaling: ["Complete rest is preferred if residual fatigue is high."],
    coachNote:
      "No formal Performance Testing result form is required. Prepare Sunday setup today.",
    safetyNote: "Finish fresher than you started. No hard station testing.",
    rpeTarget: "1–3",
    hardDay: false,
  },

  sled_push: {
    title: "Sled Push Assessment",
    purpose: "Legacy Version 1 station diagnostic — preserved for published V1 weeks only.",
    duration: "15–25 minutes",
    durationMinutes: 20,
    equipment: ["Sled", "Measured lane"],
    warmup: ["Light movement prep", "Short unloaded sled feel"],
    mainSet: ["Standardised distance, load and surface as prescribed by your coach."],
    cooldown: ["Easy flush"],
    whatToRecord: ["Distance", "Load", "Surface", "Total time", "Splits", "Pauses", "Limitation"],
    scaling: ["Compare only when sled, surface, load, footwear, lane and distance match."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Controlled effort only.",
    rpeTarget: "7–8",
    hardDay: true,
  },

  sled_pull: {
    title: "Sled Pull Assessment",
    purpose: "Legacy Version 1 station diagnostic — preserved for published V1 weeks only.",
    duration: "15–25 minutes",
    durationMinutes: 20,
    equipment: ["Sled", "Rope", "Measured lane"],
    warmup: ["Light movement prep", "Short unloaded sled-pull feel"],
    mainSet: ["Standardised distance, load and surface as prescribed by your coach."],
    cooldown: ["Easy flush"],
    whatToRecord: ["Distance", "Load", "Surface", "Total time", "Splits", "Pauses", "Limitation"],
    scaling: ["Compare only under matched conditions."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Controlled effort only.",
    rpeTarget: "7–8",
    hardDay: true,
  },

  wall_ball: {
    title: "Wall-Ball Durability",
    purpose: "Legacy Version 1 station diagnostic — preserved for published V1 weeks only.",
    duration: "10–20 minutes",
    durationMinutes: 15,
    equipment: ["Wall ball", "Target"],
    warmup: ["Easy aerobic", "Wall-ball feel sets"],
    mainSet: ["75 wall balls for time (default) or 50 for beginners."],
    cooldown: ["Easy flush"],
    whatToRecord: ["Rep target", "Total time", "Set breakdown", "Longest unbroken set", "Missed reps", "Limitation", "RPE"],
    scaling: ["Record set breakdown and longest unbroken set."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Controlled pacing.",
    rpeTarget: "7–8",
    hardDay: true,
  },

  farmers_carry: {
    title: "Farmer's Carry",
    purpose: "Legacy Version 1 station diagnostic — preserved for published V1 weeks only.",
    duration: "10–15 minutes",
    durationMinutes: 12,
    equipment: ["Farmer’s handles or dumbbells/kettlebells"],
    warmup: ["Easy movement", "Light carry feel"],
    mainSet: ["200 m for time (default)."],
    cooldown: ["Forearm / shoulder mobility"],
    whatToRecord: ["Distance", "Total time", "Drops", "Grip / posture limitation"],
    scaling: ["Record drops and grip/posture limitations."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Maintain posture.",
    rpeTarget: "6–8",
    hardDay: false,
  },

  dead_hang: {
    title: "Dead Hang Test",
    purpose: "Legacy Version 1 grip diagnostic — preserved for published V1 weeks only.",
    duration: "5–10 minutes",
    durationMinutes: 8,
    equipment: ["Pull-up bar"],
    warmup: ["Shoulder prep", "Short practice hang"],
    mainSet: [
      "Double-overhand grip, no straps",
      "Active shoulder position",
      "Timer starts when feet leave the floor",
      "Stop when grip or position fails",
    ],
    cooldown: ["Shoulder mobility"],
    whatToRecord: ["Total hang time (seconds)", "Primary limitation", "Bodyweight", "RPE"],
    scaling: ["Record bodyweight and primary limitation."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Stop when grip or position fails.",
    rpeTarget: "6–7",
    hardDay: false,
  },

  compromised_sled_run: {
    title: "Compromised Sled-Running Test",
    purpose: "Legacy Version 1 Sunday protocol — preserved for published V1 weeks only.",
    duration: "45–70 minutes",
    durationMinutes: 55,
    equipment: ["Running space", "Sled push/pull", "Open floor for burpees"],
    warmup: ["10–15 minutes easy", "Sled and burpee technique feel"],
    mainSet: [
      "3 rounds (default): 800 m run, 25 m sled push, 25 m sled pull, 10 burpee broad jumps",
      "2–3 min recovery between rounds",
    ],
    cooldown: ["Easy flush and mobility"],
    whatToRecord: ["Each round’s run and station splits", "Overall RPE", "Weakest component"],
    scaling: ["Beginner: shorter runs and reduced sled volume."],
    coachNote: "Legacy V1 protocol.",
    safetyNote: "Very high stress — warm up fully.",
    rpeTarget: "8–9",
    hardDay: true,
  },

  compromised_hyrox_benchmark: {
    title: "Hybrid365 Compromised HYROX Benchmark",
    purpose:
      "Assess running consistency, station execution and movement efficiency after accumulating sustained HYROX-specific fatigue.",
    duration: "45–70 minutes including warm-up",
    durationMinutes: 60,
    equipment: [
      "Running route or treadmill for 600m/800m repeats",
      "SkiErg",
      "Sled push and pull setup",
      "Open floor for burpee broad jumps",
      "RowErg",
      "Farmer’s carry implements",
      "Sandbag",
      "Wall ball and target",
      "Timing device",
    ],
    warmup: [
      "10–15 minutes easy running or mixed aerobic work",
      "Dynamic mobility",
      "Brief technique rehearsal for each available station",
      "2–3 progressive run efforts",
      "Short controlled touches on SkiErg and RowErg",
      "Do not create fatigue during the warm-up",
    ],
    mainSet: [
      "Protocol selection — record which you complete",
      "Standard: 600m runs (total run 4.8km)",
      "Advanced: 800m runs (total run 6.4km)",
      "Scaled/custom version if coach-approved",
      "Do not auto-select advanced based only on gender or division",
      DIVIDER,
      ...COMPROMISED_HYROX_SEQUENCE_MAIN_SET_BLOCK,
      DIVIDER,
      "Pacing guidance",
      COMPROMISED_HYROX_PACING_GUIDANCE,
      "Do not sprint the opening run",
      "Transitions should be purposeful but controlled",
      "Use sustainable technique",
      "Avoid unnecessary station breaks",
      "Try to return to running rhythm quickly after each movement",
      "Record every run and station split",
      DIVIDER,
      "Equipment and setup to record",
      "Race division/category",
      "Sled push weight · sled pull weight",
      "Farmer’s carry weight · sandbag weight",
      "Wall-ball weight and target height",
      "Sled surface and facility notes",
      "Any scaling or equipment substitutions",
      "Use race-appropriate weights where safe and practical",
      DIVIDER,
      "Movement standards — SkiErg 1,000m",
      "Efficient full-body pull — avoid arms-only",
      "Start at a controlled sustainable split",
      "Maintain rhythm and posture",
      DIVIDER,
      "Movement standards — Sled Push 50m",
      "Consistent body angle · short forceful steps",
      "Maintain pressure into the sled",
      "Record pauses and lane lengths",
      "Do not compare times across different surfaces without context",
      DIVIDER,
      "Movement standards — Sled Pull 50m",
      "Stable base · efficient hand-over-hand pulling",
      "Keep the rope organised",
      "Avoid wasted movement · record pauses",
      DIVIDER,
      "Movement standards — Burpee Broad Jumps 40m",
      "Chest reaches the floor · rise efficiently into the jump",
      "Maintain a repeatable rhythm · measure the full distance",
      "Record significant pauses",
      DIVIDER,
      "Movement standards — RowErg 1,000m",
      "Drive through the legs · maintain stroke length",
      "Controlled recovery · avoid an unsustainable opening pace",
      DIVIDER,
      "Movement standards — Farmer’s Carry 100m",
      "Tall posture · short controlled steps",
      "Minimise unnecessary grip tension",
      "Record every drop and where it occurred",
      DIVIDER,
      "Movement standards — Sandbag Lunges 50m",
      "Stable foot placement · control knee contact standard where applicable",
      "Alternate legs consistently · record breaks and left/right issues",
      DIVIDER,
      "Movement standards — Wall Balls 50",
      "Correct target and ball weight",
      "Maintain squat depth and target contact",
      "Choose a sustainable opening set",
      "Record full set breakdown and no-reps separately",
    ],
    cooldown: [
      "10–15 minutes very easy movement",
      "Hydrate",
      "Add light mobility",
      "Record results while details are fresh",
    ],
    whatToRecord: [
      "Protocol version (600m / 800m / scaled)",
      "Total completion time",
      "Overall RPE",
      "Average HR (optional)",
      "Maximum HR (optional)",
      "Overall limitation",
      "General notes",
      "Proof or video (optional)",
      "Run splits 1–8",
      "Station splits for all eight stations",
      "Optional station notes (pauses, drops, breaks, set breakdown, no-reps, technique, pain)",
      "Equipment weights and facility/setup notes",
    ],
    scaling: [
      "Scaled/custom versions must be recorded explicitly.",
      "Do not assign the 800m version automatically from gender or race division alone.",
    ],
    coachNote:
      "Enter the full continuous simulation on the Performance Testing Sunday form after finishing. Keep the formal result form separate from this session prescription.",
    safetyNote:
      "Very high stress continuous simulation. Warm up fully without creating fatigue. Use safe race-appropriate loads. Stop for true pain or unsafe technique.",
    filmPrompt: "Optional proof or video URL on the Performance Testing result form.",
    pacingNote: COMPROMISED_HYROX_PACING_GUIDANCE,
    rpeTarget: "7–9",
    hardDay: true,
  },
};

export function detailKeyForPerformanceTestType(
  testType: string | null | undefined
): PerformanceTestingDetailKey | null {
  if (!testType) return null;
  if (testType in PERFORMANCE_TESTING_SESSION_DETAILS) {
    return testType as PerformanceTestingDetailKey;
  }
  return null;
}

export function buildResolvedPrescriptionFromTestingDetail(
  detail: PerformanceTestingSessionDetailSource,
  sessionLibraryId: string
): ResolvedSessionPrescription {
  const safetyParts = [
    detail.safetyNote,
    detail.scaling.length ? `Scaling: ${detail.scaling.join(" ")}` : "",
    detail.equipment.length ? `Equipment: ${detail.equipment.join("; ")}` : "",
  ].filter(Boolean);

  return {
    sessionLibraryId,
    name: detail.title,
    category: "testing",
    subcategory: "performance_testing",
    objective: detail.purpose,
    warmup: detail.warmup,
    mainSet: detail.mainSet,
    cooldown: detail.cooldown,
    keySetSummary: detail.mainSet.find((l) => l !== DIVIDER && !l.endsWith(":")) ?? detail.title,
    targetPace: null,
    targetSplit: null,
    targetLoad: null,
    targetHRRange: null,
    fallbackHRGuide: null,
    rpeTarget: detail.rpeTarget,
    duration: detail.duration,
    hardDay: detail.hardDay,
    hardDayReason: detail.hardDay ? "Performance testing session" : undefined,
    whatToRecord: detail.whatToRecord,
    coachNote: detail.coachNote,
    safetyNote: safetyParts.join(" "),
    progressionNote: detail.scaling.join(" "),
    filmPrompt: detail.filmPrompt ?? null,
    equipmentRequired: detail.equipment,
    progressionLabel: "",
    variantSummary: "performance_testing_v2",
  };
}

function isEmptyStringArray(value: unknown): boolean {
  return !Array.isArray(value) || value.every((v) => !String(v ?? "").trim());
}

function isBlankString(value: unknown): boolean {
  return value == null || !String(value).trim();
}

/** Fill only missing prescription / editConfig detail fields from the canonical template. */
export function fillMissingFieldsFromTestingDetail<T extends {
  title?: string;
  duration?: string;
  intensity?: string;
  rpeHr?: string;
  rationale?: string;
  coachNote?: string;
  prescription: ResolvedSessionPrescription | null;
  editConfig: {
    sessionName?: string;
    objective?: string;
    warmUpLines?: string[];
    mainSetLines?: string[];
    coolDownLines?: string[];
    whatToRecord?: string[];
    coachNote?: string;
    filmPrompt?: string;
    coachPacingNote?: string;
    rpeTarget?: string;
    safetyNote?: string;
    scalingNotes?: string;
    protocol?: string;
    testType?: string;
  };
  performanceMetadata?: {
    performanceTestType?: string;
  };
}>(session: T, detail: PerformanceTestingSessionDetailSource, sessionLibraryId: string): T {
  const nextPrescription =
    session.prescription ??
    buildResolvedPrescriptionFromTestingDetail(detail, sessionLibraryId);

  const isSundayBenchmark =
    session.performanceMetadata?.performanceTestType === "compromised_hyrox_benchmark" ||
    session.editConfig?.testType === "compromised_hyrox_benchmark" ||
    sessionLibraryId.includes("compromised_hyrox_benchmark") ||
    detail.title.includes("Compromised HYROX Benchmark");

  let resolvedMainSet = isEmptyStringArray(nextPrescription.mainSet)
    ? detail.mainSet
    : nextPrescription.mainSet;
  let resolvedMainSetLines = isEmptyStringArray(session.editConfig.mainSetLines)
    ? detail.mainSet
    : (session.editConfig.mainSetLines as string[]);

  if (isSundayBenchmark) {
    resolvedMainSet = mergeCompromisedHyroxSequenceIntoMainSet(resolvedMainSet);
    resolvedMainSetLines = mergeCompromisedHyroxSequenceIntoMainSet(resolvedMainSetLines);
    // If still missing the full canonical block (e.g. old vague run lines), replace with
    // template mainSet only when the sequence marker is absent after merge of empty-ish sets.
    if (!mainSetHasCompromisedHyroxSequence(resolvedMainSet)) {
      resolvedMainSet = detail.mainSet;
    }
    if (!mainSetHasCompromisedHyroxSequence(resolvedMainSetLines)) {
      resolvedMainSetLines = detail.mainSet;
    }
  }

  const prescription: ResolvedSessionPrescription = {
    ...nextPrescription,
    name: isBlankString(nextPrescription.name) ? detail.title : nextPrescription.name,
    objective: isBlankString(nextPrescription.objective)
      ? detail.purpose
      : nextPrescription.objective,
    warmup: isEmptyStringArray(nextPrescription.warmup)
      ? detail.warmup
      : nextPrescription.warmup,
    mainSet: resolvedMainSet,
    cooldown: isEmptyStringArray(nextPrescription.cooldown)
      ? detail.cooldown
      : nextPrescription.cooldown,
    whatToRecord: isEmptyStringArray(nextPrescription.whatToRecord)
      ? detail.whatToRecord
      : nextPrescription.whatToRecord,
    coachNote: isBlankString(nextPrescription.coachNote)
      ? detail.coachNote
      : nextPrescription.coachNote,
    safetyNote: isBlankString(nextPrescription.safetyNote)
      ? detail.safetyNote
      : nextPrescription.safetyNote,
    filmPrompt: isBlankString(nextPrescription.filmPrompt)
      ? detail.filmPrompt ?? null
      : nextPrescription.filmPrompt,
    equipmentRequired:
      !nextPrescription.equipmentRequired?.length
        ? detail.equipment
        : nextPrescription.equipmentRequired,
    rpeTarget: isBlankString(nextPrescription.rpeTarget)
      ? detail.rpeTarget
      : nextPrescription.rpeTarget,
    duration: isBlankString(nextPrescription.duration)
      ? detail.duration
      : nextPrescription.duration,
    keySetSummary: isBlankString(nextPrescription.keySetSummary)
      ? detail.mainSet[0] ?? detail.title
      : nextPrescription.keySetSummary,
  };

  const editConfig = {
    ...session.editConfig,
    sessionName: isBlankString(session.editConfig.sessionName)
      ? detail.title
      : session.editConfig.sessionName,
    objective: isBlankString(session.editConfig.objective)
      ? detail.purpose
      : session.editConfig.objective,
    warmUpLines: isEmptyStringArray(session.editConfig.warmUpLines)
      ? detail.warmup
      : session.editConfig.warmUpLines,
    mainSetLines: resolvedMainSetLines,
    coolDownLines: isEmptyStringArray(session.editConfig.coolDownLines)
      ? detail.cooldown
      : session.editConfig.coolDownLines,
    whatToRecord: isEmptyStringArray(session.editConfig.whatToRecord)
      ? detail.whatToRecord
      : session.editConfig.whatToRecord,
    coachNote: isBlankString(session.editConfig.coachNote)
      ? detail.coachNote
      : session.editConfig.coachNote,
    filmPrompt: isBlankString(session.editConfig.filmPrompt)
      ? detail.filmPrompt
      : session.editConfig.filmPrompt,
    coachPacingNote: isBlankString(session.editConfig.coachPacingNote)
      ? detail.pacingNote
      : session.editConfig.coachPacingNote,
    rpeTarget: isBlankString(session.editConfig.rpeTarget)
      ? detail.rpeTarget
      : session.editConfig.rpeTarget,
    scalingNotes: isBlankString(session.editConfig.scalingNotes)
      ? detail.scaling.join("\n")
      : session.editConfig.scalingNotes,
    protocol: isBlankString(session.editConfig.protocol)
      ? [...detail.warmup, DIVIDER, ...detail.mainSet, DIVIDER, ...detail.cooldown].join("\n")
      : session.editConfig.protocol,
  };

  return {
    ...session,
    title: isBlankString(session.title) ? detail.title : session.title,
    duration: isBlankString(session.duration) ? detail.duration : session.duration,
    intensity: isBlankString(session.intensity) ? detail.rpeTarget : session.intensity,
    rpeHr: isBlankString(session.rpeHr) ? detail.rpeTarget : session.rpeHr,
    rationale: isBlankString(session.rationale) ? detail.purpose : session.rationale,
    coachNote: isBlankString(session.coachNote) ? detail.coachNote : session.coachNote,
    prescription,
    editConfig,
  };
}
