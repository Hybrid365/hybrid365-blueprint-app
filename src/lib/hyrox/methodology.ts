import type { HyroxSessionCategory } from "./types";

export type KeySessionType = {
  id: string;
  name: string;
  category: HyroxSessionCategory;
  purpose: string;
  scalingNote: string;
};

export type ProgressionRule = {
  id: string;
  domain: "threshold" | "z2" | "erg" | "compromised" | "strength" | "testing";
  rule: string;
};

export type RaceTimelineRule = {
  phase: "far" | "mid" | "near" | "race_week";
  weeksOut: string;
  emphasis: string[];
  deemphasis: string[];
};

export type ScalingRule = {
  principle: string;
  beginner: string;
  intermediate: string;
  advanced: string;
  pro: string;
};

export const HYROX_METHODOLOGY = {
  corePhilosophy:
    "Build the engine with controlled threshold and aerobic volume, use ergs and bike to add fitness without unnecessary impact, layer in Hyrox specificity closer to race day, and make every station session improve the athlete's ability to run again under fatigue.",

  principles: [
    "Alternate easy and hard days where possible — protect adaptation and running tolerance.",
    "Monitor and progress time spent in threshold zones each week (run + erg).",
    "Use SkiErg, RowErg and bike to accumulate threshold and Z2 volume without the same impact cost as extra running.",
    "Hyrox specificity increases closer to race day; base and engine work dominate early blocks.",
    "Key sessions keep the same method and benefit across levels; scale volume, load, rest and complexity.",
    "Use 5km, 10km and baseline testing to prescribe running speeds, erg targets, loads and progressions.",
    "Every compromised session should answer: can this athlete run well again after the station work?",
    "Strength supports station durability and injury resilience — it is not bodybuilding volume for its own sake.",
    "Recovery profile and weekly stress budget gate how many true hard days are allowed.",
    "Phase 1 / Block 1: aerobic base and load tolerance before threshold volume spikes — progress total volume first.",
    "Avoid grey-zone training — easy days clearly easy (Z1–Z2), hard days clearly hard (threshold, compromised, dense strength).",
    "Week 4 of each 4-week block deloads volume slightly while keeping rhythm.",
    "Double sessions progress: aerobic double → threshold + easy aerobic → threshold run + erg threshold — never jump straight to double threshold.",
    "Threshold intensity is HR/RPE-governed — reduce pace if fatigued rather than force numbers.",
    "Hyrox threshold progression: longer reps and shorter rest before adding speed.",
    "Station weaknesses from assessment directly change weekly focus and add-ons.",
    "Strength for Hyrox prioritises leg endurance and grip — minimise DOMS that ruins key runs.",
  ],

  keySessionTypes: [
    {
      id: "easy_run",
      name: "Easy Run",
      category: "run_development",
      purpose: "Aerobic base, tissue tolerance, rhythm between hard days.",
      scalingNote: "Same Z2 intent; shorten duration for beginners, extend for advanced.",
    },
    {
      id: "threshold_run",
      name: "Threshold Run",
      category: "run_development",
      purpose: "Raise sustainable engine — controlled discomfort, repeatable pace.",
      scalingNote: "Same interval structure; adjust work duration, reps and rest from 5k/10k zones.",
    },
    {
      id: "erg_threshold",
      name: "Erg Threshold",
      category: "erg_development",
      purpose: "Threshold stimulus with low impact — supports engine without extra run damage.",
      scalingNote: "Same 4-min or similar method; scale watts/pace and rep count.",
    },
    {
      id: "compromised_builder",
      name: "Compromised Running Builder",
      category: "compromised_running",
      purpose: "Practice running under station fatigue — race-relevant rhythm.",
      scalingNote: "Same station→run pattern; reduce load, reps or run length by level.",
    },
    {
      id: "lower_strength",
      name: "Lower Strength / Durability",
      category: "strength",
      purpose: "Sled, lunge, carry and leg resilience for Hyrox stations.",
      scalingNote: "Same movement patterns; scale load, sets and density.",
    },
    {
      id: "benchmark",
      name: "Benchmark / Testing",
      category: "testing",
      purpose: "Anchor paces, loads and progressions for prescription.",
      scalingNote: "Same test where possible; use scaled distances or loads for beginners.",
    },
  ] satisfies KeySessionType[],

  progressionRules: [
    {
      id: "threshold_weekly",
      domain: "threshold",
      rule: "Track total minutes at threshold (run + erg) per week; progress 5–10% when RPE, sleep and soreness are stable for 2 weeks.",
    },
    {
      id: "z2_floor",
      domain: "z2",
      rule: "Maintain a Z2 floor via easy runs, bike and mixed erg — especially when run volume is capped.",
    },
    {
      id: "erg_substitution",
      domain: "erg",
      rule: "When running tolerance is limited, substitute 1:1 time at threshold on Ski/Row/bike before adding extra run intervals.",
    },
    {
      id: "compromised_timing",
      domain: "compromised",
      rule: "Introduce short compromised blocks mid-block; extend density and race-pace runs in the final 4–6 weeks.",
    },
    {
      id: "strength_density",
      domain: "strength",
      rule: "Progress strength via load or density, not random extra exercises — align to limiter (sled, wall ball, carry).",
    },
    {
      id: "retest_cadence",
      domain: "testing",
      rule: "Retest 5km and key stations every 4–6 weeks in build phases; reduce testing load in taper.",
    },
    {
      id: "volume_before_threshold_swap",
      domain: "threshold",
      rule: "Block 1: increase weekly aerobic volume and load tolerance before swapping easy volume to extra threshold.",
    },
    {
      id: "threshold_rep_before_speed",
      domain: "threshold",
      rule: "Progress threshold via longer work bouts and reduced rest before increasing pace.",
    },
    {
      id: "week4_deload",
      domain: "z2",
      rule: "Week 4 of each 4-week block: reduce total volume ~10–20%; maintain session types and rhythm.",
    },
    {
      id: "advanced_run_cap_erg_extra",
      domain: "erg",
      rule: "Beyond ~40–50 km/week run, add extra threshold/Z2 via erg/bike to protect run quality.",
    },
  ] satisfies ProgressionRule[],

  raceTimelineRules: [
    {
      phase: "far",
      weeksOut: "12–9 weeks",
      emphasis: ["easy_run", "threshold_run", "erg_threshold", "strength_base", "benchmark_baseline"],
      deemphasis: ["full_race_simulation", "high_density_compromised"],
    },
    {
      phase: "mid",
      weeksOut: "8–5 weeks",
      emphasis: ["threshold_progression", "long_aerobic", "compromised_builders", "station_capacity"],
      deemphasis: ["maximal_testing_weeks"],
    },
    {
      phase: "near",
      weeksOut: "4–2 weeks",
      emphasis: ["race_pace_repeats", "compromised_density", "transitions", "taper_volume_drop"],
      deemphasis: ["new_strength_maxes", "volume_spikes"],
    },
    {
      phase: "race_week",
      weeksOut: "1 week",
      emphasis: ["sharpness", "mobility", "race_prep", "minimal_fatigue"],
      deemphasis: ["heavy_threshold", "long_sessions"],
    },
  ] satisfies RaceTimelineRule[],

  scalingRules: [
    {
      principle: "Preserve training intent across levels",
      beginner: "Shorter work intervals, longer rest, lighter loads, fewer stations per block.",
      intermediate: "Standard structures with prescribed paces from 5k/10k tests.",
      advanced: "Full prescribed volume; tighter rests; race-pace elements in compromised work.",
      pro: "Highest sustainable density; minimal rest; full station loads where tolerated.",
    },
    {
      principle: "Hard/easy rhythm",
      beginner: "Max 2 hard days; never back-to-back hard run + compromised.",
      intermediate: "2–3 hard days with easy/erg between.",
      advanced: "3 hard days possible with erg Z2 support.",
      pro: "May use doubles (erg Z2 + hard) if recovery supports.",
    },
    {
      principle: "Impact management",
      beginner: "Bias erg/bike for extra aerobic minutes.",
      intermediate: "Balance run and erg threshold 50/50 when niggles present.",
      advanced: "Add run volume only when weekly soreness is low.",
      pro: "Monitor weekly run km + compromised count; deload on yellow flags.",
    },
  ] satisfies ScalingRule[],

  athleteTypeDescriptions: {
    beginner_foundation: "New to structured Hyrox training — needs base aerobic volume, movement quality and conservative hard-day spacing.",
    running_limited: "Engine or run durability is the limiter — threshold, easy frequency and long aerobic are priorities.",
    station_limited: "Stations break down before the run — sled, wall ball, lunges and erg threshold support running.",
    strength_dominant_run_limited: "Strong in the gym but fades on runs — run frequency and compromised pacing over max strength.",
    runner_dominant_station_limited: "Runs well fresh but loses rhythm after stations — compromised density and station strength.",
    balanced_intermediate: "No single glaring limiter — progressive hybrid structure with even run/station/strength distribution.",
    advanced_competitive: "High training age — tolerates density, doubles and race-specific simulations.",
    high_output_poor_recovery: "Can hit sessions hard but accumulates fatigue — fewer hard days, more Z2 bike/erg.",
  },

  weeklyStructureGuidance:
    "Map available days to hard/easy slots first, then assign session types from the library. Never stack threshold run, heavy legs and full compromised on consecutive days for running-limited athletes.",

  dataInformsPrescription:
    "5km time anchors interval and threshold run paces; 10km refines aerobic and steady zones; erg tests set watts/500m targets; station benchmarks set loads and rep schemes; bodyweight and recovery scores adjust weekly hard-day count.",

  // ——— Extended coaching model (v2) ———

  blockProgrammingModel: {
    phase1Block1:
      "Build aerobic base, load tolerance and the athlete's ability to cope with training before rushing threshold volume. Overall volume progresses first; then some volume can swap toward more threshold work.",
    laterPhases:
      "Later phases add intensity above race pace, faster running, then more Hyrox-specific compromised running as race day approaches.",
    avoidGreyZone:
      "Avoid grey-zone drift — easy days clearly easy, hard days clearly hard. Classification uses threshold HR time, RPE, muscular fatigue, impact load and effect on next-day recovery.",
    week4Deload:
      "Week 4 of each 4-week block: slight deload in overall volume while maintaining weekly rhythm and movement patterns.",
  },

  hardEasyClassification: {
    hardDaySignals: [
      "Material time at threshold HR / RPE 7–8+",
      "High muscular fatigue (strength density, compromised stations)",
      "High impact load (hard run intervals, long compromised)",
      "Meaningful recovery cost next day",
    ],
    easyDaySignals: [
      "Z1–Z2 HR, RPE 3–5",
      "Low impact (bike, erg, easy jog)",
      "Supports recovery while adding aerobic duration",
    ],
    weeklyRhythm:
      "Easy/hard rhythm where possible. Sunday often longer-duration aerobic; Monday recovery-leaning aerobic plus upper strength. Not every athlete uses Sun/Mon training — map to their calendar.",
  },

  doubleSessionProgression: {
    ladder: [
      "1. Double aerobic days (e.g. easy run AM + bike Z2 PM)",
      "2. Threshold run AM + easy aerobic PM",
      "3. Threshold run AM + SkiErg/RowErg threshold PM (lower end of run threshold)",
    ],
    doNot:
      "Do not jump straight to double-threshold days. Readiness requires prior weeks' volume, recovery and check-ins.",
    preferredFormat:
      "Lower-end threshold run + erg threshold later same day when athlete clearly tolerates load.",
    readinessFactors: [
      "Previous 2–3 weeks training volume",
      "Sleep and check-in recovery markers",
      "Absence of niggles / HRV or resting HR flags if tracked",
    ],
  },

  runningAndPaceRules: {
    benchmarks:
      "Use 5km and 10km to estimate easy, steady, threshold, 10km, 5km and Hyrox race paces. If only 5km exists, estimate 10km/threshold anchors from 5km (coaching formula).",
    intensityGovernance:
      "Pace plus HR/RPE. If fatigued and prescribed threshold pace pushes above threshold HR, reduce pace — correct intensity matters, not forced numbers.",
    thresholdProgressionHyrox:
      "Favour longer rep duration and reduced recovery before simply increasing speed.",
    treadmill: "Default 1% incline unless calf/Achilles or other limitation.",
    environment: "Outdoor/track preferred for key sessions where possible.",
    advancedRunVolume:
      "Build toward ~40–50 km/week running for advanced athletes. Extra volume/threshold beyond that generally via bike/Ski/Row to protect run quality.",
  },

  aerobicAndErgRules: {
    purpose:
      "Bike, SkiErg and RowErg build aerobic volume while protecting quality run sessions.",
    highVolumeAthletes:
      "12–15+ hours/week: easy aerobic can sit more Z1/low Z2 due to high total load.",
    timeRestrictedAthletes: "Z2 work should be purposeful true/higher Z2 — quality over junk volume.",
    ergThresholdTarget:
      "Ski/Row threshold targets can sit ~5s faster than estimated race pace, still governed by HR/RPE and test data.",
  },

  stationWeaknessPersonalisation: {
    principle:
      "Athlete-reported station weaknesses directly influence programming — add-ons, rotated block focus, and compromised progressions.",
    rotationWhenMultipleWeak:
      "If multiple weaknesses and limited time, rotate emphasis across the 4-week block so all are addressed (see stationPersonalisation.ts).",
    wallBalls: "Extra WB volume; 10 min EMOM add-ons early → WB under fatigue near race.",
    sled: "Extra sled volume; integrate into leg strength; frequent exposure when equipment allows.",
    burpees: "Extra rhythm/volume → burpees under fatigue in compromised work.",
  },

  strengthPhilosophyDetail: {
    hyroxPriority:
      "Leg endurance often beats top-end max strength for Hyrox. Support running and stations, not DOMS that ruins key sessions.",
    lowerBody:
      "Tempo squats/hack squats, higher reps, controlled rest, breathing through reps, slow-twitch and quad endurance, calf strength, RDLs, lunges, isolated quad/calf work.",
    upperBody:
      "Grip-specific work including max DB holds heavier than race weight where appropriate.",
    avoid: "Grinding max singles that compromise next-day run or compromised session.",
  },

  recoveryCheckInAdjustment: {
    poorSleep:
      "Suggest monitoring HRV/resting HR if available. Reduce threshold volume or swap hard day for easier aerobic.",
    futureDashboard:
      "Dashboard should eventually suggest session swaps from check-in data (sleep, soreness, recovery, pain).",
    triggers: [
      "Poor sleep 2+ nights",
      "High soreness + poor motivation",
      "Pain/niggle flags in check-in",
      "Missed sessions + accumulated fatigue",
    ],
  },

  bodyweightPerformance: {
    goal: "Lean, fast, performance-optimised athletes — not generic weight loss.",
    coachNotes:
      "Depending on start point: lean up, maintain, or add lean muscle. Fat loss must not compromise key session quality or recovery.",
  },

  sessionProgressionPhilosophy: {
    blockConsistency:
      "Keep similar key sessions within a 4-week block with clear weekly progression, then adjust stimulus after block (or week 4 deload).",
    scaleLevers: "Volume, intensity, complexity, load, rest — same intended benefit per level.",
    examplesRef: "See sessionProgression.ts for threshold, WB EMOM, compromised, sled and leg endurance templates.",
  },

  dashboardPersonalisation: {
    show:
      "Individual focuses, goals, targets, key sessions, coaching notes and why sessions were chosen from assessment/testing.",
    filmPrompts:
      "Prompt filming key station or movement sets for Telegram feedback, movement review and social proof.",
    documentation:
      "Encourage documentation even if not all content is published — accountability and coach review.",
  },

  documentationGuidance: [
    "Encourage as much documentation as possible — not all content must be used publicly.",
    "Supports accountability, Telegram coaching feedback, movement quality review and social proof.",
    "Use prompts such as 'Film this set for feedback' on key station or technique sessions.",
  ],
} as const;

export type HyroxMethodology = typeof HYROX_METHODOLOGY;
