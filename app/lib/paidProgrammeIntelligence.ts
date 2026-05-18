/**
 * Milestone 10 — paid-only assessment intelligence (additive metadata + rationale support).
 *
 * Audit (how the live engine already uses inputs — this module does NOT replace that):
 * - mapAssessmentToProgrammeInput: maps DB assessment + benchmarks → PaidProgrammeInput (goal_focus,
 *   ability_level, weekly_hours_band, days_per_week, equipment, five_k_time, notes, double_session_days, etc.).
 * - generate12WeekProgramme: loops progressionTargets × buildWeekBlueprint per week; applies double sessions.
 * - buildWeekBlueprint: picks weekly structure + sessions from SESSION_LIBRARY using goal_focus, ability_level,
 *   weekly_hours_band, days_per_week, equipment, five_k_time (pace), notes via parseConstraints (injury/time/modality).
 * - weeklyStructures: maps goal → structure bias for the week skeleton.
 * - progressionTargets: block/week focus + load bands per programme type and goal_focus.
 * - sessionLibrary: templates, roles, equipment gates, tags.
 * - programmeRationale: coach copy from assessment context + input (this file feeds richer copy).
 *
 * v1 scope: deterministic profile + rationale_notes for copy; no heavy sessionLibrary rewrites here.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type { GoalFocus } from "./sessionLibrary";
import {
  countCoreBaselineAreas,
  isStrengthBenchmarkType,
} from "./benchmarkCoreAreas";
import { parseConstraints } from "./parseConstraints";
import { planWeeklyRunVolume } from "./runVolumePlanner";

// ─── Public types ─────────────────────────────────────────────────────────────

export type PaidProgrammeIntelligence = {
  primary_goal: GoalFocus;
  event_mode: "event" | "general";
  event_specificity:
    | "none"
    | "hyrox_open"
    | "hyrox_pro"
    | "hyrox_doubles"
    | "running_race"
    | "triathlon"
    | "other";
  limiter_focus:
    | "running_endurance"
    | "running_speed"
    | "strength"
    | "hyrox_stations"
    | "body_composition"
    | "recovery"
    | "consistency"
    | "general";
  impact_risk: "low" | "moderate" | "high";
  benchmark_confidence: "low" | "medium" | "high";
  engine_biases: string[];
  rationale_notes: string[];
};

export type BenchmarkSignals = {
  has_5k: boolean;
  has_3k: boolean;
  has_skierg: boolean;
  has_row: boolean;
  has_bodyweight: boolean;
  /** True if any run marker (5 km or 3 km) is logged. */
  has_any_run: boolean;
  /** True if SkiErg or Row logged. */
  has_engine: boolean;
  /** Any canonical strength benchmark type logged. */
  has_strength_marker: boolean;
  strength_marker_count: number;
  /** 0–4: body, run, engine, strength areas (see `benchmarkCoreAreas`). */
  core_areas_score: number;
  /** Engine markers comparatively thin vs strength baselines. */
  engine_weaker_than_strength: boolean;
  latest_5k: string | null;
  latest_3k: string | null;
  latest_skierg: string | null;
  latest_row: string | null;
  latest_bodyweight: number | null;
  latest_pullup_reps: number | null;
  latest_pushup_reps: number | null;
  latest_squat_rm_kg: number | null;
  latest_bench_rm_kg: number | null;
  latest_hinge_display: string | null;
  latest_farmer_carry: string | null;
  /** @deprecated use core_areas_score */
  logged_core_types: number;
};

export type IntelligenceAssessmentSlice = {
  event_type?: string | null;
  event_date?: string | null;
  target_time?: string | null;
  biggest_limiter?: string | null;
  injury_flags?: string[] | null;
  movements_to_avoid?: string[] | null;
  hyrox_experience?: string | null;
  strength_experience?: string | null;
  goal_focus_raw?: string | null;
};

export type BuildIntelligenceArgs = BlueprintInput & {
  email?: string;
  rationale_context?: {
    assessment?: IntelligenceAssessmentSlice;
    hasBaseline5k?: boolean;
    hasBenchmarkTests?: boolean;
    double_session_days?: string[];
    benchmark_signals?: BenchmarkSignals;
  };
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function combinedText(a: IntelligenceAssessmentSlice | undefined, notes: string | undefined): string {
  const parts = [
    a?.biggest_limiter,
    ...(a?.injury_flags ?? []),
    ...(a?.movements_to_avoid ?? []),
    a?.goal_focus_raw,
    notes,
  ]
    .filter(Boolean)
    .map((x) => String(x));
  return parts.join(" ").toLowerCase();
}

export function parseEventSpecificity(eventType: string | null | undefined): PaidProgrammeIntelligence["event_specificity"] {
  const t = norm(eventType);
  if (!t || t.includes("no event")) return "none";
  if (t.includes("hyrox pro")) return "hyrox_pro";
  if (t.includes("hyrox open")) return "hyrox_open";
  if (t.includes("double")) return "hyrox_doubles";
  if (t.includes("triathlon")) return "triathlon";
  if (t.includes("running")) return "running_race";
  return "other";
}

export function inferLimiterFocus(
  goal: GoalFocus,
  blob: string
): PaidProgrammeIntelligence["limiter_focus"] {
  const b = blob;
  if (/knee|bad knees|low impact|injury|pain|can't run|cannot run|avoid running|shin|achilles|ankle|back pain|shoulder/.test(b)) {
    return "recovery";
  }
  if (/consistency|time|busy|motivation|habit|structure|adherence/.test(b)) return "consistency";
  if (/body fat|composition|lean|weight loss|recomp|fat loss/.test(b)) return "body_composition";
  if (/wall ball|wallball|sled|farmer|sandbag|hyrox stations|ski erg|skierg|rower/.test(b)) {
    return "hyrox_stations";
  }
  if (/running under fatigue|fatigue after stations|hold pace after stations/.test(b)) {
    if (/speed|interval|pace|economy|5k pb|tempo|vo2|sprint/.test(b)) return "running_speed";
    return "running_endurance";
  }
  if (goal === "running" || /5k|10k|marathon|endurance|engine|stamina|aerobic base|long run/.test(b)) {
    if (/speed|interval|pace|economy|5k pb|tempo|vo2|sprint/.test(b)) return "running_speed";
    return "running_endurance";
  }
  if (/strength|squat|deadlift|lift|weak upper|press|pull/.test(b)) return "strength";
  return "general";
}

function benchmarkConfidence(
  sig: BenchmarkSignals | undefined,
  hasBaseline5k: boolean,
  goal: GoalFocus,
  limiter: PaidProgrammeIntelligence["limiter_focus"]
): PaidProgrammeIntelligence["benchmark_confidence"] {
  let c = sig?.core_areas_score ?? 0;
  if (hasBaseline5k && !sig?.has_any_run && !sig?.has_5k) c = Math.min(4, c + 1);
  const wantsStrengthEvidence =
    goal === "muscle" || limiter === "body_composition" || limiter === "strength";
  if (wantsStrengthEvidence && sig?.has_strength_marker) c = Math.min(4, c + 1);
  if (c >= 3) return "high";
  if (c >= 2) return "medium";
  if (c >= 1) return "medium";
  return "low";
}

/** Row shape matches dashboard `benchmark_tests` / `BenchmarkTestRowForProgramme`. */
export type BenchmarkRowLite = {
  test_type: string | null;
  test_time: string | null;
  test_value: number | null;
  test_unit?: string | null;
  tested_at: string | null;
};

/** Latest-per-type signals for rationale and confidence (deterministic). */
export function buildBenchmarkSignals(tests: BenchmarkRowLite[]): BenchmarkSignals {
  const sorted = [...tests].sort((a, b) =>
    String(b.tested_at ?? "").localeCompare(String(a.tested_at ?? ""))
  );
  let latest_5k: string | null = null;
  let latest_3k: string | null = null;
  let latest_skierg: string | null = null;
  let latest_row: string | null = null;
  let latest_bodyweight: number | null = null;
  let has_5k = false;
  let has_3k = false;
  let has_skierg = false;
  let has_row = false;
  let has_bodyweight = false;
  let latest_pullup_reps: number | null = null;
  let latest_pushup_reps: number | null = null;
  let latest_squat_rm_kg: number | null = null;
  let latest_bench_rm_kg: number | null = null;
  let latest_hinge_display: string | null = null;
  let latest_farmer_carry: string | null = null;
  const strengthTypesSeen = new Set<string>();

  for (const row of sorted) {
    const ty = (row.test_type ?? "").trim();
    const tyl = ty.toLowerCase();
    const time = row.test_time?.trim() || null;
    const val = row.test_value != null && Number.isFinite(row.test_value) ? Number(row.test_value) : null;

    if (!has_5k && (ty === "5km time trial" || tyl === "5km tt" || tyl === "5k time trial")) {
      if (time) {
        has_5k = true;
        latest_5k = time;
      }
    }
    if (!has_3k && ty === "3km time trial" && time) {
      has_3k = true;
      latest_3k = time;
    }
    if (!has_skierg && ty === "1km SkiErg" && time) {
      has_skierg = true;
      latest_skierg = time;
    }
    if (!has_row && ty === "1km Row" && time) {
      has_row = true;
      latest_row = time;
    }
    if (
      !has_bodyweight &&
      ty === "Bodyweight" &&
      row.test_value != null &&
      Number.isFinite(row.test_value)
    ) {
      has_bodyweight = true;
      latest_bodyweight = row.test_value;
    }

    if (isStrengthBenchmarkType(ty)) {
      strengthTypesSeen.add(ty);
      if (ty === "Pull-up max reps" && val != null && latest_pullup_reps == null) latest_pullup_reps = val;
      if (ty === "Push-up max reps" && val != null && latest_pushup_reps == null) latest_pushup_reps = val;
      if ((ty === "Squat 5RM" || ty === "Squat 8RM") && val != null && latest_squat_rm_kg == null) {
        latest_squat_rm_kg = val;
      }
      if (ty === "DB Bench 8RM" && val != null && latest_bench_rm_kg == null) latest_bench_rm_kg = val;
      if ((ty === "RDL 8RM" || ty === "Trap bar deadlift 5RM") && latest_hinge_display == null) {
        const bit =
          val != null
            ? `${val}${row.test_unit?.trim() ? ` ${row.test_unit}` : " kg"}`
            : time ?? "logged";
        latest_hinge_display = `${ty.includes("RDL") ? "RDL" : "Trap bar"} ${bit}`;
      }
      if (ty === "Farmer carry 40m" && latest_farmer_carry == null) {
        latest_farmer_carry = time ?? (val != null ? String(val) : "logged");
      }
    }
  }

  const has_any_run = has_5k || has_3k;
  const has_engine = has_skierg || has_row;
  const has_strength_marker = strengthTypesSeen.size > 0;
  const core_areas_score = countCoreBaselineAreas(tests as { test_type: string | null }[]);
  const engine_weaker_than_strength =
    has_strength_marker &&
    strengthTypesSeen.size >= 2 &&
    (!has_engine || (!has_any_run && !has_5k));

  const logged_core_types = core_areas_score;

  return {
    has_5k,
    has_3k,
    has_skierg,
    has_row,
    has_bodyweight,
    has_any_run,
    has_engine,
    has_strength_marker,
    strength_marker_count: strengthTypesSeen.size,
    core_areas_score,
    engine_weaker_than_strength,
    latest_5k,
    latest_3k,
    latest_skierg,
    latest_row,
    latest_bodyweight,
    latest_pullup_reps,
    latest_pushup_reps,
    latest_squat_rm_kg,
    latest_bench_rm_kg,
    latest_hinge_display,
    latest_farmer_carry,
    logged_core_types,
  };
}

function impactRisk(parsed: ReturnType<typeof parseConstraints>, blob: string): PaidProgrammeIntelligence["impact_risk"] {
  if (parsed.flags.includes("injury_flags") || parsed.flags.includes("low_impact_preference")) return "high";
  if (/knee|bad knees|injury|pain|avoid|cannot|can't/.test(blob)) return "high";
  if (parsed.flags.includes("time_limit") || parsed.modality_avoids.sled || parsed.modality_avoids.rower || parsed.modality_avoids.ski) {
    return "moderate";
  }
  return "low";
}

function engineBiases(args: {
  limiter: PaidProgrammeIntelligence["limiter_focus"];
  eventSpec: PaidProgrammeIntelligence["event_specificity"];
  goal: GoalFocus;
  parsed: ReturnType<typeof parseConstraints>;
  equipment: string[];
}): string[] {
  const biases: string[] = [];
  const { limiter, eventSpec, goal, parsed, equipment } = args;
  const eq = equipment.join(" ").toLowerCase();

  if (limiter === "running_endurance") biases.push("aerobic_base", "long_run_quality", "threshold_support");
  if (limiter === "running_speed") biases.push("interval_quality", "stride_economy", "pace_control");
  if (limiter === "strength") biases.push("strength_protection", "controlled_run_volume");
  if (limiter === "hyrox_stations") biases.push("compromised_running", "wall_ball_durability", "sled_carry_exposure");
  if (limiter === "body_composition") biases.push("sustainable_intensity", "strength_retention", "aerobic_volume_balance");
  if (limiter === "recovery") biases.push("low_impact_options", "substitution_first");
  if (limiter === "consistency") biases.push("repeatable_sessions", "clear_priority_order", "reduced_complexity");

  if (eventSpec === "hyrox_pro") biases.push("race_specific_density", "pro_weight_readiness");
  if (eventSpec === "hyrox_open") biases.push("progressive_specificity", "station_skill_layering");
  if (eventSpec === "hyrox_doubles") biases.push("shared_pacing_awareness", "handoff_fatigue_management");
  if (eventSpec === "running_race") biases.push("run_first_language", "race_pace_blocks");
  if (eventSpec === "triathlon") biases.push("multi_discipline_engine", "aerobic_durability");

  if (goal === "muscle") biases.push("hypertrophy_supporting_conditioning");
  if (goal === "hybrid" && eventSpec === "none") biases.push("general_performance_blend");

  if (parsed.modality_avoids.sled) biases.push("sled_substitution_bias");
  if (parsed.modality_avoids.rower) biases.push("rower_substitution_bias");
  if (parsed.modality_avoids.ski) biases.push("ski_substitution_bias");
  if (!eq.includes("full gym") && eq.length > 0) biases.push("equipment_constrained_selection");

  return [...new Set(biases)];
}

function rationaleNotes(args: {
  intel: Omit<PaidProgrammeIntelligence, "rationale_notes" | "engine_biases">;
  sig: BenchmarkSignals | undefined;
  hasBenchmarkTests: boolean;
  assessment?: IntelligenceAssessmentSlice;
}): string[] {
  const lines: string[] = [];
  const { intel, sig, hasBenchmarkTests, assessment } = args;

  if (intel.event_mode === "general") {
    lines.push("Programme language targets general hybrid fitness: fitter, stronger, faster, and more capable week to week — without forcing a race narrative.");
  }
  if (intel.event_specificity === "hyrox_pro") {
    lines.push("Hyrox Pro: expect more race-specific compromised work and station durability language as you move through Block 3.");
  }
  if (intel.event_specificity === "hyrox_open") {
    lines.push("Hyrox Open: specificity ramps progressively — stations and race-style work build without overloading you early.");
  }
  if (intel.event_specificity === "hyrox_doubles") {
    lines.push("Doubles racing: pacing and repeatability matter; the plan stays individual but respects shared-race demands in how fatigue is layered.");
  }
  if (intel.event_specificity === "running_race") {
    lines.push("Running race focus: copy and priorities lean run quality, pacing, and economy — less Hyrox-specific phrasing.");
  }

  switch (intel.limiter_focus) {
    case "running_endurance":
      lines.push("Limiter — running endurance: the plan emphasises repeatable aerobic work and sustainable threshold support, not just short speed.");
      break;
    case "running_speed":
      lines.push("Limiter — running speed: intervals, strides, and pace control are highlighted; slow-only weeks are avoided as the sole answer.");
      break;
    case "strength":
      lines.push("Limiter — strength: main lifts stay protected; running volume is kept honest so lifting quality does not get buried.");
      break;
    case "hyrox_stations":
      lines.push("Limiter — Hyrox stations: biased toward wall balls, sleds, carries, and compromised running where equipment allows — substitutions noted when gear is limited.");
      break;
    case "body_composition":
      lines.push("Limiter — body composition: sustainable output and recovery matter as much as intensity; no chronic red-line weeks.");
      break;
    case "recovery":
      lines.push(
        "Limiter — recovery / impact: low-impact options and substitution-first guidance; progression stays conservative."
      );
      break;
    case "consistency":
      lines.push(
        "Limiter — consistency: lower complexity, fewer brutal pairings, and clearer Priority 1 guidance so the week is repeatable."
      );
      break;
    default:
      break;
  }

  if (intel.impact_risk === "high") {
    lines.push("Impact / injury signals: conservative progression and substitution-first language throughout.");
  }

  const wantsStrengthEvidence =
    intel.primary_goal === "muscle" ||
    intel.limiter_focus === "body_composition" ||
    intel.limiter_focus === "strength";

  if (!hasBenchmarkTests && !sig?.has_5k && !sig?.has_any_run) {
    lines.push("Benchmarks: programme runs without full baselines — logging tests will sharpen tracking and confidence.");
  } else {
    if (sig?.latest_5k) lines.push(`5 km signal: ${sig.latest_5k} informs running pace expectations where relevant.`);
    if (sig?.latest_3k) lines.push(`3 km signal: ${sig.latest_3k} supports run pacing where a shorter trial is used.`);
    if (sig?.latest_skierg) lines.push(`1 km SkiErg: ${sig.latest_skierg} adds engine context for erg-heavy weeks.`);
    if (sig?.latest_row) lines.push(`1 km Row: ${sig.latest_row} adds engine context for erg-heavy weeks.`);
    if (sig?.latest_bodyweight != null) lines.push(`Bodyweight marker: ${sig.latest_bodyweight} kg logged for trajectory context.`);
    if (sig?.has_strength_marker) {
      const bits: string[] = [];
      if (sig.latest_pullup_reps != null) bits.push(`pull-ups ${sig.latest_pullup_reps} reps`);
      if (sig.latest_pushup_reps != null) bits.push(`push-ups ${sig.latest_pushup_reps} reps`);
      if (sig.latest_squat_rm_kg != null) bits.push(`squat ${sig.latest_squat_rm_kg} kg`);
      if (sig.latest_bench_rm_kg != null) bits.push(`DB bench ${sig.latest_bench_rm_kg} kg`);
      if (sig.latest_hinge_display) bits.push(sig.latest_hinge_display);
      if (sig.latest_farmer_carry) bits.push(`farmer carry ${sig.latest_farmer_carry}`);
      if (bits.length) lines.push(`Strength baselines logged (${bits.join(", ")}) — lifting progress can be tracked alongside engine work.`);
      else lines.push("Strength baselines logged — measurable lift markers are on file for hybrid tracking.");
    }
    if (sig?.engine_weaker_than_strength) {
      lines.push("Profile skew: strength baselines are ahead of engine markers — copy will bias protecting strength quality while aerobic capacity catches up.");
    }
  }

  if (wantsStrengthEvidence && !sig?.has_strength_marker) {
    lines.push(
      "Strength markers: add at least one lift or rep-max test (squat, bench, pull-ups, etc.) so strength-focused goals have measurable baselines alongside engine data."
    );
  }

  if (assessment?.hyrox_experience && /competitive|pro|elite/i.test(assessment.hyrox_experience)) {
    lines.push("Hyrox experience: competitive background — readiness language can assume higher training literacy.");
  }

  return lines;
}

export function buildPaidProgrammeIntelligence(input: BuildIntelligenceArgs): PaidProgrammeIntelligence {
  const notes = input.notes ?? "";
  const parsed = parseConstraints(notes);
  const a = input.rationale_context?.assessment;
  const blob = combinedText(a, notes);
  const goal = input.goal_focus;
  const eventSpec = parseEventSpecificity(a?.event_type ?? null);
  const event_mode: PaidProgrammeIntelligence["event_mode"] = eventSpec === "none" ? "general" : "event";
  const limiter_focus = inferLimiterFocus(goal, blob);
  const impact_risk = impactRisk(parsed, blob);
  const sig = input.rationale_context?.benchmark_signals;
  const hasBaseline5k = Boolean(input.rationale_context?.hasBaseline5k);
  const hasBenchmarkTests = Boolean(input.rationale_context?.hasBenchmarkTests);
  const benchmark_confidence = benchmarkConfidence(
    sig,
    hasBaseline5k || Boolean(input.five_k_time?.trim()),
    goal,
    limiter_focus
  );

  const engine_biases = engineBiases({
    limiter: limiter_focus,
    eventSpec,
    goal,
    parsed,
    equipment: input.equipment ?? [],
  });

  const base: Omit<PaidProgrammeIntelligence, "rationale_notes" | "engine_biases"> = {
    primary_goal: goal,
    event_mode,
    event_specificity: eventSpec,
    limiter_focus,
    impact_risk,
    benchmark_confidence,
  };

  const rationale_notes = rationaleNotes({
    intel: base,
    sig,
    hasBenchmarkTests,
    assessment: a,
  });

  const runPlan = planWeeklyRunVolume(input, 1);
  if (runPlan.rationaleLine && !rationale_notes.includes(runPlan.rationaleLine)) {
    rationale_notes.unshift(runPlan.rationaleLine);
  }
  if (
    runPlan.runStructureSummary &&
    !rationale_notes.some((n) => n.includes(runPlan.runStructureSummary.slice(0, 24)))
  ) {
    rationale_notes.unshift(runPlan.runStructureSummary);
  }

  return {
    ...base,
    engine_biases,
    rationale_notes,
  };
}
