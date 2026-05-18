/**
 * Progression families — coached week-by-week session variants + measurable markers.
 * Paid 12-week programmes resolve variants by block week (1–4) and athlete profile.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { resolveHyroxProgressionFamilyId } from "./hyroxTrackContext";
import type { AbilityLevel, GoalFocus } from "./sessionLibrary";
import type { RunProgressionSlot } from "./runSessionProgression";

export type ProgressionMarker = {
  threshold_total_minutes?: number;
  interval_total_reps?: number;
  interval_rep_duration_seconds?: number;
  long_run_minutes?: number;
  weekly_run_exposures?: number;
  estimated_run_volume_km?: number;
  strength_main_lift_sets?: number;
  strength_main_lift_reps?: number;
  density_minutes?: number;
  total_work_sets?: number;
  hyrox_station_density?: number;
  low_impact_aerobic_minutes?: number;
  previous_week_comparison?: string;
};

export type ProgressionFamilyVariant = {
  block_week: 1 | 2 | 3 | 4;
  title: string;
  main: string[];
  template_id?: string;
  marker: ProgressionMarker;
  progression_focus: string;
  coach_snippet: string;
};

export type ProgressionFamily = {
  family_id: string;
  category:
    | "threshold"
    | "interval"
    | "long"
    | "easy"
    | "strength"
    | "hybrid"
    | "low_impact";
  levels: AbilityLevel[];
  goals: GoalFocus[];
  /** Optional: only for deload-capable families */
  deload_variant?: boolean;
  variants: ProgressionFamilyVariant[];
};

export type AppliedProgression = {
  family_id: string;
  variant: ProgressionFamilyVariant;
  intentional_repeat?: boolean;
};

function blockWeekIndex(weekNumber: number): 1 | 2 | 3 | 4 {
  return (((weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
}

function isDeloadWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return true;
  return blockWeekIndex(weekNumber) === 4;
}

function variantForWeek(
  family: ProgressionFamily,
  weekNumber: number,
  weekFocus?: string | null
): ProgressionFamilyVariant {
  const bw = isDeloadWeek(weekNumber, weekFocus) ? 4 : blockWeekIndex(weekNumber);
  return family.variants.find((v) => v.block_week === bw) ?? family.variants[0]!;
}

// ─── Family definitions ───────────────────────────────────────────────────────

export const PROGRESSION_FAMILIES: ProgressionFamily[] = [
  {
    family_id: "threshold_volume_a",
    category: "threshold",
    levels: ["intermediate", "advanced"],
    goals: ["running", "hybrid"],
    variants: [
      {
        block_week: 1,
        title: "5 x 5 min Threshold",
        template_id: "THR-4X5M",
        main: ["10–15 min easy", "3×20s strides", "5×5 min @ threshold effort", "75s easy jog between", "8–10 min easy"],
        marker: { threshold_total_minutes: 25, previous_week_comparison: "Baseline threshold block" },
        progression_focus: "Establish rhythm at controlled threshold effort.",
        coach_snippet:
          "This week introduces sustainable threshold blocks — stay even, not heroic, on rep one.",
      },
      {
        block_week: 2,
        title: "6 x 5 min Threshold",
        template_id: "THR-4X5M",
        main: ["10–15 min easy", "3×20s strides", "6×5 min @ threshold effort", "75s easy jog between", "8–10 min easy"],
        marker: {
          threshold_total_minutes: 30,
          previous_week_comparison: "+5 min total threshold volume vs last week",
        },
        progression_focus: "Adds five minutes of total controlled threshold work while keeping recovery honest.",
        coach_snippet:
          "This week progresses your threshold work by adding one more 5-minute rep — effort should stay repeatable.",
      },
      {
        block_week: 3,
        title: "5 x 6 min Threshold",
        template_id: "THR-3X8M",
        main: ["10–15 min easy", "3×20s strides", "5×6 min @ threshold effort", "75s easy jog between", "8–10 min easy"],
        marker: {
          threshold_total_minutes: 30,
          previous_week_comparison: "Longer reps — same total minutes, higher density per rep",
        },
        progression_focus: "Shifts to slightly longer reps to build threshold tolerance under fatigue.",
        coach_snippet:
          "Reps are a touch longer this week — control the first half so the last rep does not collapse.",
      },
      {
        block_week: 4,
        title: "4 x 5 min Controlled Threshold",
        template_id: "THR-SHORT",
        main: ["10 min easy", "2×20s strides", "4×5 min @ controlled threshold", "90s easy jog between", "8 min easy"],
        marker: {
          threshold_total_minutes: 20,
          previous_week_comparison: "Deload — reduced threshold volume for absorption",
        },
        progression_focus: "Control week — threshold volume drops so you absorb the last three weeks.",
        coach_snippet:
          "This is a control week. Keep threshold work crisp but leave energy in the tank for the next build.",
      },
    ],
  },
  {
    family_id: "threshold_volume_beginner_a",
    category: "threshold",
    levels: ["beginner"],
    goals: ["running", "hybrid", "muscle"],
    variants: [
      {
        block_week: 1,
        title: "3 x 5 min Intro Threshold",
        template_id: "THR-SHORT",
        main: ["8–10 min easy jog", "3×5 min @ controlled effort", "90s easy walk/jog between", "5–8 min easy"],
        marker: { threshold_total_minutes: 15 },
        progression_focus: "Introduce short controlled efforts without racing them.",
        coach_snippet: "The goal is confidence and rhythm — not maximum effort.",
      },
      {
        block_week: 2,
        title: "4 x 4 min Intro Threshold",
        template_id: "THR-SHORT",
        main: ["8–10 min easy", "4×4 min @ controlled effort", "75–90s easy between", "5–8 min easy"],
        marker: { threshold_total_minutes: 16, previous_week_comparison: "+1 rep, slightly shorter reps" },
        progression_focus: "One more rep with manageable duration — build tolerance gradually.",
        coach_snippet: "Add consistency before intensity — every rep should look similar.",
      },
      {
        block_week: 3,
        title: "3 x 6 min Intro Threshold",
        template_id: "THR-SHORT",
        main: ["10 min easy", "3×6 min @ controlled effort", "90s easy between", "5–8 min easy"],
        marker: { threshold_total_minutes: 18, previous_week_comparison: "Slightly longer reps" },
        progression_focus: "Extend rep duration while keeping effort controlled.",
        coach_snippet: "Stay patient on rep one — the win is finishing controlled.",
      },
      {
        block_week: 4,
        title: "2 x 5 min Control Threshold",
        template_id: "THR-SHORT",
        main: ["8 min easy", "2×5 min @ easy-controlled effort", "2 min easy between", "5 min easy"],
        marker: { threshold_total_minutes: 10, previous_week_comparison: "Deload threshold" },
        progression_focus: "Deload — less quality volume, more recovery.",
        coach_snippet: "Control week — keep it light and finish feeling you could do more.",
      },
    ],
  },
  {
    family_id: "interval_density_a",
    category: "interval",
    levels: ["intermediate", "advanced"],
    goals: ["running", "hybrid"],
    variants: [
      {
        block_week: 1,
        title: "12 x 400m Intervals",
        template_id: "INT-12X400",
        main: ["15 min easy", "12×400m @ 5k–10k effort", "90s easy jog recovery", "10 min easy"],
        marker: { interval_total_reps: 12, interval_rep_duration_seconds: 90 },
        progression_focus: "Short reps to develop speed and form under manageable fatigue.",
        coach_snippet: "Focus on rhythm and posture — not sprinting rep one.",
      },
      {
        block_week: 2,
        title: "8 x 600m Intervals",
        template_id: "INT-8X600",
        main: ["15 min easy", "8×600m @ 5k–10k effort", "90s easy jog", "10 min easy"],
        marker: {
          interval_total_reps: 8,
          interval_rep_duration_seconds: 120,
          previous_week_comparison: "Longer reps — fewer total reps",
        },
        progression_focus: "Progress to longer reps for aerobic power development.",
        coach_snippet: "Longer reps this week — hold form when breathing gets harder.",
      },
      {
        block_week: 3,
        title: "6 x 1km Intervals",
        template_id: "INT-6X1K10K",
        main: ["15 min easy", "6×1km @ 10k effort", "2 min easy jog", "10 min easy"],
        marker: {
          interval_total_reps: 6,
          previous_week_comparison: "Race-relevant 1km reps",
        },
        progression_focus: "Race-relevant density — km reps with honest recovery.",
        coach_snippet: "This is the most specific interval week of the block — pace, don't panic.",
      },
      {
        block_week: 4,
        title: "6 x 400m Control Intervals",
        template_id: "INT-SHORT-6X400",
        main: ["10 min easy", "6×400m @ controlled effort", "2 min easy", "8 min easy"],
        marker: { interval_total_reps: 6, previous_week_comparison: "Deload intervals" },
        progression_focus: "Deload — fewer reps, more recovery between.",
        coach_snippet: "Keep these snappy but controlled — absorb the block.",
      },
    ],
  },
  {
    family_id: "long_run_base_a",
    category: "long",
    levels: ["beginner", "intermediate"],
    goals: ["running", "hybrid", "muscle"],
    variants: [
      {
        block_week: 1,
        title: "60 min Easy Long Run",
        template_id: "LONG-AEROBIC",
        main: ["60 min continuous @ easy Z2"],
        marker: { long_run_minutes: 60 },
        progression_focus: "Build aerobic duration at truly easy effort.",
        coach_snippet: "Patience early — this should feel conversational throughout.",
      },
      {
        block_week: 2,
        title: "70 min Easy Long Run",
        template_id: "LONG-AEROBIC",
        main: ["70 min continuous @ easy Z2"],
        marker: { long_run_minutes: 70, previous_week_comparison: "+10 min long run" },
        progression_focus: "Extend long-run duration by ten minutes.",
        coach_snippet: "Your long run builds again — fuel and hydrate like it matters.",
      },
      {
        block_week: 3,
        title: "75 min Long Run (Steady Finish)",
        template_id: "LONG-PROGRESSIVE",
        main: ["65 min easy Z2", "Final 10–15 min @ steady (not hard)"],
        marker: { long_run_minutes: 75, previous_week_comparison: "Steady finish segment added" },
        progression_focus: "Same duration with a steadier closing section under mild fatigue.",
        coach_snippet:
          "The final 10–15 minutes should feel purposeful but still controlled — not a race.",
      },
      {
        block_week: 4,
        title: "55 min Deload Long Run",
        template_id: "LONG-PICKUPS",
        main: ["55–60 min easy Z2 only"],
        marker: { long_run_minutes: 55, previous_week_comparison: "Deload long run" },
        progression_focus: "Deload — trim duration so you absorb the block.",
        coach_snippet: "Shorter long run by design — recovery is the session goal.",
      },
    ],
  },
  {
    family_id: "long_run_advanced_a",
    category: "long",
    levels: ["advanced"],
    goals: ["running", "hybrid"],
    variants: [
      {
        block_week: 1,
        title: "65 min Aerobic Long Run",
        template_id: "LONG-AEROBIC",
        main: ["65 min continuous @ Z2"],
        marker: { long_run_minutes: 65 },
        progression_focus: "Aerobic volume anchor for the week.",
        coach_snippet: "Hold back early — you should finish feeling you could continue.",
      },
      {
        block_week: 2,
        title: "75 min Progressive Long Run",
        template_id: "LONG-PROGRESSIVE",
        main: ["2km WU easy", "55 min Z2", "Final 15 min @ steady-modest"],
        marker: { long_run_minutes: 75, previous_week_comparison: "+10 min and progressive finish" },
        progression_focus: "Long run extends with a controlled progressive finish.",
        coach_snippet: "Build effort gradually — no sudden jumps in the final third.",
      },
      {
        block_week: 3,
        title: "85 min Endurance Long Run",
        template_id: "LONG-NEGATIVE",
        main: ["75 min Z2", "Final 10 min @ steady (controlled)"],
        marker: { long_run_minutes: 85, previous_week_comparison: "Peak long run duration" },
        progression_focus: "Peak long-run duration for the block.",
        coach_snippet: "This is the longest run of the block — respect fueling and pacing.",
      },
      {
        block_week: 4,
        title: "60 min Deload Long Run",
        template_id: "LONG-PICKUPS",
        main: ["60 min easy Z2", "Optional 4×30s strides in final 15 min"],
        marker: { long_run_minutes: 60, previous_week_comparison: "Deload" },
        progression_focus: "Deload long run — absorb previous volume.",
        coach_snippet: "Keep it easy — strides optional only if legs feel fresh.",
      },
    ],
  },
  {
    family_id: "beginner_run_tolerance_a",
    category: "easy",
    levels: ["beginner"],
    goals: ["running", "hybrid", "muscle"],
    variants: [
      {
        block_week: 1,
        title: "8 x 2 min Run / 1 min Walk",
        template_id: "RUN-WALK-HYBRID-INTRO",
        main: ["5 min brisk walk", "8×(2 min run / 1 min walk)", "5 min walk cool-down"],
        marker: { weekly_run_exposures: 3 },
        progression_focus: "Build run/walk tolerance without chasing pace.",
        coach_snippet: "The goal is consistency — walk breaks are part of the plan.",
      },
      {
        block_week: 2,
        title: "6 x 3 min Run / 1 min Walk",
        template_id: "RUN-WALK-HYBRID-INTRO",
        main: ["5 min walk", "6×(3 min run / 1 min walk)", "5 min walk"],
        marker: { previous_week_comparison: "Longer run intervals, fewer breaks" },
        progression_focus: "Extend run intervals — fewer total breaks.",
        coach_snippet: "You should feel more continuous each week — stay conservative on pace.",
      },
      {
        block_week: 3,
        title: "4 x 5 min Run / 90s Walk",
        template_id: "RUN-WALK-HYBRID-INTRO",
        main: ["5 min walk", "4×(5 min run / 90s walk)", "5 min walk"],
        marker: { previous_week_comparison: "Approaching continuous running" },
        progression_focus: "Longer continuous run blocks — confidence before duration.",
        coach_snippet: "If you can, finish the last run segment without needing the walk.",
      },
      {
        block_week: 4,
        title: "20 min Easy Continuous or Run/Walk",
        template_id: "RUN-WALK-HYBRID-INTRO",
        main: ["Aim 20 min easy continuous OR 4×(3 min run / 1 min walk) if needed"],
        marker: { long_run_minutes: 20, previous_week_comparison: "Deload / consolidation" },
        progression_focus: "Consolidate — optional continuous effort if tolerance allows.",
        coach_snippet: "Deload week — choose the option that leaves you feeling successful.",
      },
    ],
  },
  {
    family_id: "lower_strength_foundation_a",
    category: "strength",
    levels: ["beginner", "intermediate", "advanced"],
    goals: ["hybrid", "muscle", "running"],
    variants: [
      {
        block_week: 1,
        title: "Lower Strength — 3 x 5 Controlled",
        main: ["Squat pattern 3×5 @ RPE 7", "Hinge pattern 3×5 @ RPE 7", "Accessory 2×10–12"],
        marker: { strength_main_lift_sets: 3, strength_main_lift_reps: 5, total_work_sets: 8 },
        progression_focus: "Movement quality and positions — loads stay conservative.",
        coach_snippet: "Leave 2–3 reps in reserve on every main set.",
      },
      {
        block_week: 2,
        title: "Lower Strength — 4 x 5",
        main: ["Squat 4×5 @ RPE 7–8", "Hinge 4×5 @ RPE 7–8", "Accessory 3×10"],
        marker: {
          strength_main_lift_sets: 4,
          strength_main_lift_reps: 5,
          previous_week_comparison: "+1 work set per lift",
        },
        progression_focus: "Add one work set — same rep range, slight load progression if form is crisp.",
        coach_snippet: "This week adds volume, not heroics — crisp reps beat grinders.",
      },
      {
        block_week: 3,
        title: "Lower Strength — 5 x 4",
        main: ["Squat 5×4 @ RPE 8", "Hinge 4×4 @ RPE 8", "Accessory 3×8–10"],
        marker: {
          strength_main_lift_sets: 5,
          strength_main_lift_reps: 4,
          previous_week_comparison: "Heavier emphasis — slightly lower reps",
        },
        progression_focus: "Shift to slightly heavier sets of four when bar speed stays good.",
        coach_snippet: "Stop sets before form breaks down — especially on hinge work.",
      },
      {
        block_week: 4,
        title: "Lower Strength — 3 x 5 Deload",
        main: ["Squat 3×5 @ RPE 6–7", "Hinge 3×5 @ RPE 6–7", "Light accessory 2×12"],
        marker: { strength_main_lift_sets: 3, previous_week_comparison: "Deload strength" },
        progression_focus: "Deload — reduce sets and load to absorb the block.",
        coach_snippet: "This week keeps lifting in the programme without digging a recovery hole.",
      },
    ],
  },
  {
    family_id: "upper_strength_hypertrophy_a",
    category: "strength",
    levels: ["beginner", "intermediate", "advanced"],
    goals: ["hybrid", "muscle", "running"],
    variants: [
      {
        block_week: 1,
        title: "Upper Strength — Baseline Volume",
        main: ["Push 3×8–10", "Pull 3×8–10", "Accessory 2×12–15"],
        marker: { strength_main_lift_sets: 3, total_work_sets: 10 },
        progression_focus: "Establish upper-body training baseline.",
        coach_snippet: "Controlled tempo — feel the muscle, not just move the weight.",
      },
      {
        block_week: 2,
        title: "Upper Strength — Added Set",
        main: ["Push 4×8–10", "Pull 4×8–10", "Accessory 3×12"],
        marker: { strength_main_lift_sets: 4, previous_week_comparison: "+1 set upper volume" },
        progression_focus: "Add one set on main upper patterns.",
        coach_snippet: "Same effort standard — add load only if all sets stay clean.",
      },
      {
        block_week: 3,
        title: "Upper Strength — Load / Density",
        main: ["Push 4×6–8 (heavier)", "Pull 4×6–8", "Accessory 3×10–12"],
        marker: { previous_week_comparison: "Heavier rep range" },
        progression_focus: "Slightly heavier loads or shorter rest on accessories.",
        coach_snippet: "Hypertrophy responds to quality volume — not grinding every set.",
      },
      {
        block_week: 4,
        title: "Upper Strength — Deload Volume",
        main: ["Push 2×8 @ RPE 6", "Pull 2×8 @ RPE 6", "Light accessory 2×15"],
        marker: { previous_week_comparison: "Deload upper" },
        progression_focus: "Deload upper volume.",
        coach_snippet: "Keep sessions short — you're backing off so lower-body and runs recover.",
      },
    ],
  },
  {
    family_id: "wall_ball_durability_a",
    category: "hybrid",
    levels: ["intermediate", "advanced"],
    goals: ["hybrid"],
    variants: [
      {
        block_week: 1,
        title: "Wall Ball — 5 x 20 Controlled",
        main: ["5×20 wall balls", "Rest 60–90s — focus positions"],
        marker: { hyrox_station_density: 100 },
        progression_focus: "Skill and breathing under manageable station volume.",
        coach_snippet: "Smooth cycles — don't sprint the first set.",
      },
      {
        block_week: 2,
        title: "Wall Ball — 4 x 30",
        main: ["4×30 wall balls", "Rest 75s"],
        marker: { hyrox_station_density: 120, previous_week_comparison: "More reps per set" },
        progression_focus: "Increase reps per set — same rest discipline.",
        coach_snippet: "Break before form fails — quality beats speed here.",
      },
      {
        block_week: 3,
        title: "Wall Ball — 3 x 40 Under Fatigue",
        main: ["800m easy run", "3×40 wall balls", "400m jog between sets"],
        marker: { hyrox_station_density: 120, previous_week_comparison: "Fatigue prefatigue" },
        progression_focus: "Station work after running — race-relevant durability.",
        coach_snippet: "Expect higher heart rate — control breathing on the wall ball.",
      },
      {
        block_week: 4,
        title: "Wall Ball — Technique Deload",
        main: ["4×15 perfect reps", "Rest as needed"],
        marker: { previous_week_comparison: "Deload station volume" },
        progression_focus: "Deload — technique and positions only.",
        coach_snippet: "Light and crisp — you're absorbing the previous three weeks.",
      },
    ],
  },
  {
    family_id: "compromised_run_a",
    category: "hybrid",
    levels: ["intermediate", "advanced"],
    goals: ["hybrid", "running"],
    variants: [
      {
        block_week: 1,
        title: "Short Compromised Run Block",
        main: ["3 rounds: 500m row + 20 wall balls + 600m run @ controlled"],
        marker: { hyrox_station_density: 3 },
        progression_focus: "Introduce compromised running with short stations.",
        coach_snippet: "Pace the run for repeatability, not a single heroic round.",
      },
      {
        block_week: 2,
        title: "Compromised Run — More Rounds",
        main: ["4 rounds: 500m ski + 25 wall balls + 800m run @ controlled"],
        marker: { hyrox_station_density: 4, previous_week_comparison: "+1 round" },
        progression_focus: "Add a round — same controlled run intent.",
        coach_snippet: "Round three is where most athletes blow up — stay disciplined.",
      },
      {
        block_week: 3,
        title: "Race-Style Compromised Block",
        main: ["3 rounds: 1km run + sled push + 1km run @ 10k effort"],
        marker: { previous_week_comparison: "Denser race-style structure" },
        progression_focus: "Race-style density — longer runs between stations.",
        coach_snippet: "This week should feel specific — hydrate and fuel like training matters.",
      },
      {
        block_week: 4,
        title: "Compromised Run — Control",
        main: ["2 rounds easy: 600m row + 400m run @ easy"],
        marker: { previous_week_comparison: "Deload compromised volume" },
        progression_focus: "Deload — reduce rounds and intensity.",
        coach_snippet: "Keep it submaximal — you're absorbing hybrid stress.",
      },
    ],
  },
  {
    family_id: "low_impact_aerobic_a",
    category: "low_impact",
    levels: ["beginner", "intermediate", "advanced"],
    goals: ["running", "hybrid", "muscle"],
    variants: [
      {
        block_week: 1,
        title: "Low-Impact Aerobic — 30 min",
        main: ["30 min bike or row @ easy Z2"],
        marker: { low_impact_aerobic_minutes: 30 },
        progression_focus: "Aerobic support without impact stress.",
        coach_snippet: "Use this to build engine when running volume must stay conservative.",
      },
      {
        block_week: 2,
        title: "Low-Impact Aerobic — 35 min",
        main: ["35 min bike or row @ easy Z2"],
        marker: { low_impact_aerobic_minutes: 35, previous_week_comparison: "+5 min" },
        progression_focus: "Gradual aerobic extension on low-impact modalities.",
        coach_snippet: "Same easy standard — slightly longer duration.",
      },
      {
        block_week: 3,
        title: "Low-Impact Aerobic — 40 min",
        main: ["40 min bike or row @ easy Z2"],
        marker: { low_impact_aerobic_minutes: 40, previous_week_comparison: "+5 min" },
        progression_focus: "Continue building low-impact aerobic base.",
        coach_snippet: "If symptoms flare, shorten — consistency beats one big session.",
      },
      {
        block_week: 4,
        title: "Low-Impact Aerobic — 30 min Deload",
        main: ["30 min easy bike or row only"],
        marker: { low_impact_aerobic_minutes: 30, previous_week_comparison: "Deload" },
        progression_focus: "Deload low-impact volume.",
        coach_snippet: "Easy week — support recovery for the next block.",
      },
    ],
  },
];

const FAMILY_BY_ID = new Map(PROGRESSION_FAMILIES.map((f) => [f.family_id, f]));

export function getProgressionFamily(familyId: string): ProgressionFamily | undefined {
  return FAMILY_BY_ID.get(familyId);
}

export function resolveRunProgressionFamily(
  slot: RunProgressionSlot,
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null,
  lowImpact?: boolean
): ProgressionFamily | null {
  if (lowImpact && (slot === "easy" || slot === "long")) {
    return FAMILY_BY_ID.get("low_impact_aerobic_a") ?? null;
  }

  const beginner = input.ability_level === "beginner";

  if (slot === "threshold") {
    return FAMILY_BY_ID.get(beginner ? "threshold_volume_beginner_a" : "threshold_volume_a") ?? null;
  }
  if (slot === "interval") {
    return beginner ? null : FAMILY_BY_ID.get("interval_density_a") ?? null;
  }
  if (slot === "long") {
    if (beginner) return FAMILY_BY_ID.get("long_run_base_a") ?? null;
    return input.ability_level === "advanced"
      ? FAMILY_BY_ID.get("long_run_advanced_a") ?? null
      : FAMILY_BY_ID.get("long_run_base_a") ?? null;
  }
  if (slot === "easy") {
    if (beginner) return FAMILY_BY_ID.get("beginner_run_tolerance_a") ?? null;
    return null;
  }
  return null;
}

export function resolveStrengthFamilyForRole(
  role: string,
  input: BlueprintInput,
  opts?: {
    hyrox?: import("./hyroxTrackContext").HyroxTrackContext | null;
    weekNumber?: number;
    weekFocus?: string | null;
  }
): ProgressionFamily | null {
  if (opts?.hyrox?.active) {
    const familyId = resolveHyroxProgressionFamilyId(
      role,
      opts.hyrox,
      opts.weekNumber ?? 1,
      opts.weekFocus
    );
    if (familyId) return FAMILY_BY_ID.get(familyId) ?? null;
  }

  if (role === "lower_primary" || role === "lower_full") {
    return FAMILY_BY_ID.get("lower_strength_foundation_a") ?? null;
  }
  if (role === "upper_primary" || role === "upper_full") {
    return FAMILY_BY_ID.get("upper_strength_hypertrophy_a") ?? null;
  }
  if (role === "hybrid_primary" && input.goal_focus === "hybrid") {
    return FAMILY_BY_ID.get("compromised_run_a") ?? null;
  }
  if (role === "hybrid_density" && input.goal_focus === "hybrid") {
    return FAMILY_BY_ID.get("wall_ball_durability_a") ?? null;
  }
  return null;
}

export function applyProgressionFamily(
  family: ProgressionFamily,
  weekNumber: number,
  weekFocus?: string | null
): AppliedProgression {
  const variant = variantForWeek(family, weekNumber, weekFocus);
  return { family_id: family.family_id, variant };
}

export function mergeFamilyIntoSessionTitle(
  baseName: string,
  applied: AppliedProgression
): string {
  return applied.variant.title || baseName;
}

export function blockPhaseLabel(weekNumber: number, weekFocus?: string | null): string {
  if (isDeloadWeek(weekNumber, weekFocus)) return "deload_control";
  const bw = blockWeekIndex(weekNumber);
  if (weekNumber <= 3 || (weekNumber >= 5 && weekNumber <= 7) || (weekNumber >= 9 && weekNumber <= 11)) {
    if (bw === 1) return "build_foundation";
    if (bw === 2) return "extend_quality";
    if (bw === 3) return "peak_density";
  }
  if (weekNumber >= 9) return "specificity_sharpen";
  if (weekNumber === 12) return "taper_test";
  return "build";
}

export function summariseWeekMarkers(
  schedule: Array<{
    progression_marker?: ProgressionMarker | null;
    title: string;
    tags?: string[];
  }>
): ProgressionMarker {
  const agg: ProgressionMarker = {};
  let threshold = 0;
  let longRun = 0;
  let runExposures = 0;

  for (const day of schedule) {
    const m = day.progression_marker;
    const t0 = day.tags?.[0] ?? "";
    if (
      t0 === "threshold_run" ||
      t0 === "interval_run" ||
      t0 === "long_run" ||
      t0 === "aerobic_run" ||
      t0 === "tempo_run"
    ) {
      runExposures += 1;
    }
    if (!m) continue;
    if (m.threshold_total_minutes) threshold += m.threshold_total_minutes;
    if (m.long_run_minutes) longRun = Math.max(longRun, m.long_run_minutes);
    if (m.low_impact_aerobic_minutes) agg.low_impact_aerobic_minutes = m.low_impact_aerobic_minutes;
    if (m.strength_main_lift_sets) {
      agg.strength_main_lift_sets = m.strength_main_lift_sets;
      agg.strength_main_lift_reps = m.strength_main_lift_reps;
    }
    if (m.hyrox_station_density) agg.hyrox_station_density = m.hyrox_station_density;
  }

  if (threshold > 0) agg.threshold_total_minutes = threshold;
  if (longRun > 0) agg.long_run_minutes = longRun;
  if (runExposures > 0) agg.weekly_run_exposures = runExposures;
  return agg;
}
