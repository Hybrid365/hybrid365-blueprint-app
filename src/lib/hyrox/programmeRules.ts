import type {
  AthleteClassificationId,
  BlockWeekInCycle,
  DoubleSessionReadiness,
  HyroxSessionCategory,
  ProgrammeRule,
  RaceTimelinePhase,
  RecoveryStatus,
  StationWeakness,
} from "./types";
import {
  getStationWeaknessRules,
  rotateStationFocusForBlock,
} from "./stationPersonalisation";
import {
  applyRaceTimelineToStructure,
  suggestWeeklyStructure,
  weeksToRacePhase,
} from "./weeklyStructureRules";

export type ProgrammeContext = {
  classification: AthleteClassificationId;
  raceTimeline: RaceTimelinePhase;
  weeksToRace?: number | null;
  mainLimiter?: "running" | "stations" | "strength" | "recovery" | "balanced";
  trainingDaysAvailable: number;
  allowsDoubleSessions: boolean;
  recoveryStatus: RecoveryStatus;
  equipment: string[];
  hasSkiErg: boolean;
  hasRowErg: boolean;
  hasBike: boolean;
  hasSled: boolean;
  hasFullGym: boolean;
  /** 1 = Build the Base — prioritise volume tolerance before threshold swap */
  programmeBlock?: 1 | 2 | 3;
  blockWeekInCycle?: BlockWeekInCycle;
  stationWeaknesses?: StationWeakness[];
  doubleSessionReadiness?: DoubleSessionReadiness;
  weeklyTrainingHours?: number;
  onlyFiveKmBenchmark?: boolean;
  sleepQuality?: "good" | "poor";
  /** Suggest HRV / resting HR monitoring when recovery is poor */
  suggestRecoveryMonitoring?: boolean;
  preferErgOverRun?: boolean;
};

export type SessionSelectionHint = {
  category: HyroxSessionCategory;
  sessionIds?: string[];
  tags?: string[];
  priority: "must" | "should" | "may";
  reason: string;
};

export const HYROX_PROGRAMME_RULES: ProgrammeRule[] = [
  {
    id: "hard_easy_spacing",
    priority: "must",
    when: "Always",
    then: "Do not schedule threshold run, heavy legs and full compromised session on consecutive days.",
    sessionCategories: ["run_development", "compromised_running", "strength"],
  },
  {
    id: "avoid_grey_zone",
    priority: "must",
    when: "Always",
    then: "Easy days must be clearly easy (Z1–Z2, RPE 3–5). Hard days clearly hard — no moderate junk between key sessions.",
    sessionTags: ["easy", "z2"],
  },
  {
    id: "hard_easy_classification",
    priority: "should",
    when: "Always",
    then: "Classify hard/easy using threshold HR time, RPE, muscular fatigue, impact load and recovery cost — not duration alone.",
  },
  {
    id: "block1_volume_before_threshold",
    priority: "must",
    when: "programmeBlock === 1",
    then: "Build aerobic base and load tolerance first — progress total volume before swapping easy volume to extra threshold.",
    sessionCategories: ["run_development", "erg_development"],
    sessionTags: ["easy", "z2", "long_run"],
  },
  {
    id: "week4_deload",
    priority: "must",
    when: "blockWeekInCycle === 4",
    then: "Reduce overall volume ~10–20% while maintaining weekly rhythm and session types.",
  },
  {
    id: "sunday_monday_easy_bias",
    priority: "should",
    when: "Always",
    then: "Where calendar allows: Sunday longer aerobic duration; Monday recovery-leaning aerobic + upper strength.",
    sessionTags: ["easy", "long_run", "upper"],
  },
  {
    id: "double_session_ladder",
    priority: "must",
    when: "allowsDoubleSessions",
    then: "Progress doubles: aerobic double → threshold run + easy aerobic → threshold run + erg threshold. Never jump straight to double threshold.",
  },
  {
    id: "double_threshold_only_when_ready",
    priority: "must",
    when: "doubleSessionReadiness === threshold_run_plus_erg_threshold",
    then: "Preferred format: lower-end threshold run AM + SkiErg/RowErg threshold PM. Requires good prior weeks, volume and check-ins.",
    sessionCategories: ["run_development", "erg_development"],
    sessionTags: ["threshold"],
  },
  {
    id: "double_aerobic_only",
    priority: "should",
    when: "doubleSessionReadiness === aerobic_double_only",
    then: "Only double aerobic (e.g. easy run + bike Z2) — no second threshold.",
    sessionTags: ["easy", "z2", "bike"],
  },
  {
    id: "running_limited_threshold",
    priority: "must",
    when: "classification === running_limited",
    then: "Prioritise threshold runs, easy running frequency, long aerobic, and controlled compromised running.",
    sessionCategories: ["run_development", "compromised_running"],
    sessionTags: ["threshold", "z2", "long_run"],
  },
  {
    id: "station_limited_capacity",
    priority: "must",
    when: "classification === station_limited || classification === runner_dominant_station_limited",
    then: "Prioritise station capacity, sleds, wall balls, lunges, erg threshold while maintaining run maintenance.",
    sessionCategories: ["compromised_running", "strength", "erg_development"],
    sessionTags: ["sled", "wall_ball", "lunges", "compromised"],
  },
  {
    id: "station_weakness_wall_balls",
    priority: "should",
    when: "stationWeakness wall_balls",
    then: "Add wall ball volume — 10 min EMOM add-ons early block; WB under fatigue closer to race.",
    sessionTags: ["wall_ball"],
  },
  {
    id: "station_weakness_sled",
    priority: "should",
    when: "stationWeakness sled_push_pull",
    then: "Extra sled volume in leg sessions; frequent sled exposure when equipment allows.",
    sessionTags: ["sled"],
  },
  {
    id: "station_weakness_burpees",
    priority: "should",
    when: "stationWeakness burpees",
    then: "Burpee rhythm/volume progressions; burpees under fatigue in compromised work later.",
    sessionTags: ["burpee"],
  },
  {
    id: "station_weakness_rotate",
    priority: "should",
    when: "multipleStationWeaknesses",
    then: "Rotate station emphasis across 4-week block when time cannot cover all weaknesses every week.",
  },
  {
    id: "poor_recovery_z2",
    priority: "must",
    when: "classification === high_output_poor_recovery || recoveryStatus === poor",
    then: "Reduce hard days to max 2; substitute extra Z2 bike/erg for run volume; consider swapping hard day for easy aerobic.",
    sessionCategories: ["erg_development"],
    sessionTags: ["z2", "bike", "recovery"],
  },
  {
    id: "poor_sleep_monitoring",
    priority: "should",
    when: "sleepQuality === poor || recoveryStatus === poor",
    then: "Suggest monitoring HRV/resting HR if available; reduce threshold volume or swap hard session.",
  },
  {
    id: "pace_hr_rpe_governance",
    priority: "must",
    when: "Always",
    then: "If threshold pace pushes HR above threshold when fatigued, athlete reduces pace — correct intensity, not forced numbers.",
  },
  {
    id: "threshold_rep_before_speed",
    priority: "should",
    when: "Always",
    then: "Progress threshold via longer rep duration and reduced rest before increasing speed.",
    sessionTags: ["threshold"],
  },
  {
    id: "only_5k_estimate_10k",
    priority: "should",
    when: "onlyFiveKmBenchmark",
    then: "Estimate 10km/threshold anchors from 5km time until 10km test logged.",
  },
  {
    id: "treadmill_incline",
    priority: "should",
    when: "Always",
    then: "Treadmill key runs default 1% incline unless calf/Achilles or coach exception.",
  },
  {
    id: "outdoor_preferred",
    priority: "may",
    when: "Always",
    then: "Outdoor/track preferred for key run sessions where possible.",
  },
  {
    id: "advanced_run_volume_cap",
    priority: "should",
    when: "classification === advanced_competitive",
    then: "Build toward ~40–50 km/week run; extra threshold/Z2 beyond that via bike/Ski/Row.",
    sessionCategories: ["erg_development"],
  },
  {
    id: "high_volume_z1_z2",
    priority: "should",
    when: "weeklyTrainingHours >= 12",
    then: "Easy aerobic can sit more Z1/low Z2 due to high total weekly load.",
    sessionTags: ["easy", "z1", "z2"],
  },
  {
    id: "time_restricted_z2",
    priority: "should",
    when: "weeklyTrainingHours < 8",
    then: "Z2 sessions should be purposeful true/higher Z2 — avoid grey-zone junk.",
    sessionTags: ["z2"],
  },
  {
    id: "erg_threshold_race_pace_offset",
    priority: "should",
    when: "Always",
    then: "Ski/Row threshold targets ~5s faster than race pace estimate — still HR/RPE and test governed.",
    sessionTags: ["threshold", "ski", "row"],
  },
  {
    id: "hyrox_strength_endurance",
    priority: "should",
    when: "Always",
    then: "Lower-body strength: tempo, higher reps, quad/calf endurance — avoid DOMS that ruins key run/compromised.",
    sessionCategories: ["strength"],
    sessionTags: ["legs", "tempo"],
  },
  {
    id: "grip_race_weight",
    priority: "should",
    when: "Always",
    then: "Include grip work — max DB holds above race weight where appropriate.",
    sessionTags: ["grip", "carry"],
  },
  {
    id: "bodyweight_performance",
    priority: "may",
    when: "Always",
    then: "Bodyweight supports lean, fast performance goals — fat loss must not compromise key sessions.",
  },
  {
    id: "session_block_consistency",
    priority: "should",
    when: "blockWeekInCycle < 4",
    then: "Keep same key session methods within 4-week block with weekly progression; rotate stimulus after block.",
  },
  {
    id: "film_key_sessions",
    priority: "may",
    when: "Always",
    then: "Prompt filming key station/movement sets for coach feedback and social proof where useful.",
  },
  {
    id: "advanced_double_threshold",
    priority: "may",
    when: "classification === advanced_competitive && allowsDoubleSessions && doubleSessionReadiness === threshold_run_plus_erg_threshold",
    then: "Allow lower-end run threshold AM + erg threshold PM on non-consecutive days if recovery is good.",
    sessionCategories: ["run_development", "erg_development"],
    sessionTags: ["threshold"],
  },
  {
    id: "race_far_base",
    priority: "should",
    when: "raceTimeline === far",
    then: "Prioritise base, threshold, strength and baseline testing — limit full race simulations.",
    sessionCategories: ["run_development", "erg_development", "strength", "testing"],
  },
  {
    id: "race_mid_compromised",
    priority: "should",
    when: "raceTimeline === mid",
    then: "Increase compromised builders and station-specific strength; progress threshold minutes weekly.",
    sessionCategories: ["compromised_running", "strength"],
  },
  {
    id: "race_near_specific",
    priority: "must",
    when: "raceTimeline === near",
    then: "Prioritise race-pace runs, compromised density, transitions and pacing — no strength maxes.",
    sessionCategories: ["compromised_running", "run_development"],
    sessionTags: ["race_pace", "race_specific", "compromised"],
  },
  {
    id: "race_week_taper",
    priority: "must",
    when: "raceTimeline === race_week",
    then: "Cut volume sharply; only sharpness, mobility and race prep — no heavy testing.",
    sessionTags: ["recovery", "race_prep"],
  },
  {
    id: "strength_dominant_run",
    priority: "should",
    when: "classification === strength_dominant_run_limited",
    then: "Cap heavy leg days at 1/week; prioritise run frequency over extra strength volume.",
    sessionCategories: ["run_development"],
  },
  {
    id: "beginner_compromised_intro",
    priority: "must",
    when: "classification === beginner_foundation",
    then: "Use shortened compromised builders only; no threshold-into-station overload until week 4+.",
    sessionCategories: ["compromised_running"],
    sessionTags: ["compromised"],
  },
  {
    id: "equipment_no_sled",
    priority: "must",
    when: "!hasSled",
    then: "Swap sled sessions for lunge/carrier builders and posterior chain strength.",
    sessionTags: ["lunges", "carry", "posterior"],
  },
  {
    id: "equipment_erg_substitute",
    priority: "should",
    when: "preferErgOverRun",
    then: "Replace up to 50% of weekly threshold minutes with ski/row/bike threshold.",
    sessionCategories: ["erg_development"],
  },
  {
    id: "testing_cadence",
    priority: "should",
    when: "raceTimeline !== race_week",
    then: "Schedule benchmark retests every 4–6 weeks; use results to update pace calculator.",
    sessionCategories: ["testing"],
  },
  {
    id: "double_session_z2",
    priority: "may",
    when: "allowsDoubleSessions && recoveryStatus === good && doubleSessionReadiness === aerobic_double_only",
    then: "PM session Z2 bike/erg only — never second hard interval day.",
    sessionTags: ["z2", "bike", "easy"],
  },
];

function ruleMatchesContext(rule: ProgrammeRule, ctx: ProgrammeContext): boolean {
  const w = rule.when;
  if (w === "Always") return true;

  if (w.includes("programmeBlock === 1") && ctx.programmeBlock === 1) return true;
  if (w.includes("blockWeekInCycle === 4") && ctx.blockWeekInCycle === 4) return true;
  if (w.includes("allowsDoubleSessions") && ctx.allowsDoubleSessions) {
    if (w.includes("recoveryStatus === good") && ctx.recoveryStatus !== "good") return false;
    if (w.includes("doubleSessionReadiness === threshold_run_plus_erg_threshold")) {
      return ctx.doubleSessionReadiness === "threshold_run_plus_erg_threshold";
    }
    if (w.includes("doubleSessionReadiness === aerobic_double_only")) {
      return ctx.doubleSessionReadiness === "aerobic_double_only";
    }
    if (!w.includes("doubleSessionReadiness")) return true;
  }
  if (
    w.includes("stationWeakness wall_balls") &&
    (ctx.stationWeaknesses?.includes("wall_balls") || ctx.stationWeaknesses?.includes("wall_ball"))
  )
    return true;
  if (w.includes("stationWeakness sled_push_pull") && ctx.stationWeaknesses?.includes("sled_push_pull"))
    return true;
  if (w.includes("stationWeakness burpees") && ctx.stationWeaknesses?.includes("burpees"))
    return true;
  if (w.includes("multipleStationWeaknesses") && (ctx.stationWeaknesses?.length ?? 0) > 1) return true;
  if (w.includes("sleepQuality === poor") && ctx.sleepQuality === "poor") return true;
  if (w.includes("onlyFiveKmBenchmark") && ctx.onlyFiveKmBenchmark) return true;
  if (w.includes("weeklyTrainingHours >= 12") && (ctx.weeklyTrainingHours ?? 0) >= 12) return true;
  if (w.includes("weeklyTrainingHours < 8") && (ctx.weeklyTrainingHours ?? 0) < 8) return true;
  if (w.includes("blockWeekInCycle < 4") && ctx.blockWeekInCycle != null && ctx.blockWeekInCycle < 4)
    return true;
  if (w.includes("preferErgOverRun") && ctx.preferErgOverRun) return true;

  if (w.includes("classification === running_limited") && ctx.classification === "running_limited")
    return true;
  if (
    w.includes("station_limited") &&
    (ctx.classification === "station_limited" ||
      ctx.classification === "runner_dominant_station_limited")
  )
    return true;
  if (
    w.includes("high_output_poor_recovery") &&
    (ctx.classification === "high_output_poor_recovery" || ctx.recoveryStatus === "poor")
  )
    return true;
  if (
    w.includes("advanced_competitive") &&
    ctx.classification === "advanced_competitive"
  ) {
    if (w.includes("allowsDoubleSessions") && !ctx.allowsDoubleSessions) return false;
    return true;
  }
  if (w.includes("raceTimeline === far") && ctx.raceTimeline === "far") return true;
  if (w.includes("raceTimeline === mid") && ctx.raceTimeline === "mid") return true;
  if (w.includes("raceTimeline === near") && ctx.raceTimeline === "near") return true;
  if (w.includes("raceTimeline === race_week") && ctx.raceTimeline === "race_week") return true;
  if (w.includes("raceTimeline !== race_week") && ctx.raceTimeline !== "race_week") return true;
  if (w.includes("strength_dominant_run_limited") && ctx.classification === "strength_dominant_run_limited")
    return true;
  if (w.includes("beginner_foundation") && ctx.classification === "beginner_foundation") return true;
  if (w.includes("!hasSled") && !ctx.hasSled) return true;

  return false;
}

export function getApplicableProgrammeRules(ctx: ProgrammeContext): ProgrammeRule[] {
  return HYROX_PROGRAMME_RULES.filter((r) => ruleMatchesContext(r, ctx));
}

export function buildSessionSelectionHints(ctx: ProgrammeContext): SessionSelectionHint[] {
  const rules = getApplicableProgrammeRules(ctx);
  const hints: SessionSelectionHint[] = [];

  for (const rule of rules) {
    if (!rule.sessionCategories?.length && !rule.sessionTags?.length) continue;
    const categories =
      rule.sessionCategories?.length ?
        rule.sessionCategories
      : (["run_development"] as HyroxSessionCategory[]);

    for (const category of categories) {
      hints.push({
        category,
        tags: rule.sessionTags,
        priority: rule.priority,
        reason: rule.then,
      });
    }
  }

  if (ctx.stationWeaknesses?.length) {
    const week = ctx.blockWeekInCycle ?? 1;
    const focus = rotateStationFocusForBlock(ctx.stationWeaknesses, week);
    for (const rule of getStationWeaknessRules(focus)) {
      hints.push({
        category: "compromised_running",
        tags: rule.sessionTags,
        priority: "should",
        reason: rule.programmingActions.join(" "),
      });
    }
  }

  if (ctx.mainLimiter === "running") {
    hints.push({
      category: "run_development",
      tags: ["threshold", "easy", "long_run"],
      priority: "must",
      reason: "Main limiter: running",
    });
  }
  if (ctx.mainLimiter === "stations") {
    hints.push({
      category: "compromised_running",
      tags: ["compromised", "sled", "wall_ball"],
      priority: "must",
      reason: "Main limiter: stations",
    });
  }

  return hints;
}

export type WeeklySessionPlanSlot = {
  day: string;
  role: string;
  suggestedCategories: HyroxSessionCategory[];
  suggestedTags: string[];
};

export function planWeeklySessionSlots(ctx: ProgrammeContext): WeeklySessionPlanSlot[] {
  const phase = ctx.raceTimeline ?? weeksToRacePhase(ctx.weeksToRace);
  const structure = applyRaceTimelineToStructure(
    suggestWeeklyStructure({
      trainingDaysAvailable: ctx.trainingDaysAvailable,
      classification: ctx.classification,
      allowsDoubles: ctx.allowsDoubleSessions,
    }),
    phase
  );

  const hints = buildSessionSelectionHints(ctx);
  const tagSet = new Set(hints.flatMap((h) => h.tags ?? []));

  return structure.days
    .filter((d) => d.intensity !== "rest")
    .map((d) => ({
      day: d.day,
      role: d.role,
      suggestedCategories: structure.sessionCategoryEmphasis,
      suggestedTags: Array.from(tagSet),
    }));
}

/** Suggested recovery actions for dashboard (future interactive swaps). */
export function getRecoveryAdjustmentSuggestions(ctx: ProgrammeContext): string[] {
  const out: string[] = [];
  if (ctx.recoveryStatus === "poor" || ctx.sleepQuality === "poor") {
    out.push("Reduce threshold volume this week or swap one hard day for easy bike/erg.");
    out.push("Consider tracking HRV or resting HR if available.");
  }
  if (ctx.blockWeekInCycle === 4) {
    out.push("Week 4 deload — reduce volume 10–20%, keep session rhythm.");
  }
  return out;
}
