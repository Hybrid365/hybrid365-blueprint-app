import type { AthleteAssessmentRowForProgramme } from "@/app/lib/mapAssessmentToProgrammeInput";
import type { GoalFocus } from "@/app/lib/sessionLibrary";

/** Primary programming identity for paid community HYROX track — never overridden by general goals. */
export type HyroxPrimaryGoal = "hyrox_performance";

export type SecondaryGoalKind =
  | "hyrox_aligned"
  | "running_engine"
  | "strength_support"
  | "fat_loss_support"
  | "general_fitness"
  | "event_prep"
  | "unknown";

export type HyroxGoalContext = {
  primary_goal: HyroxPrimaryGoal;
  secondary_goal_raw: string | null;
  secondary_goal_kind: SecondaryGoalKind;
  secondary_goal_support_note: string | null;
  /** Layer extra tempo/run support when safe — does not replace HYROX pillars. */
  emphasise_running_support: boolean;
};

const HYROX_PRIMARY: HyroxPrimaryGoal = "hyrox_performance";

export function programmeInstanceGoalFocusForHyrox(): GoalFocus {
  /** Stored GoalFocus for DB/UI — HYROX structure comes from training_track + builder, not this field. */
  return "hybrid";
}

export function classifySecondaryGoal(goalFocus: string | null | undefined): SecondaryGoalKind {
  const g = (goalFocus ?? "").trim().toLowerCase();
  if (!g) return "unknown";
  if (/hyrox|hybrid.*performance|specific event|prepare for/.test(g)) {
    return /event/.test(g) ? "event_prep" : "hyrox_aligned";
  }
  if (/run faster|improve engine|running|engine|10k|5k|marathon/.test(g)) {
    return "running_engine";
  }
  if (/strength|muscle|build strength|hypertrophy|physique|lean muscle/.test(g)) {
    return "strength_support";
  }
  if (/fat loss|lose body fat|body fat|weight loss|cut|composition/.test(g)) {
    return "fat_loss_support";
  }
  if (/general|fitness|health/.test(g)) {
    return "general_fitness";
  }
  return "unknown";
}

export function secondaryGoalSupportNote(kind: SecondaryGoalKind): string | null {
  switch (kind) {
    case "hyrox_aligned":
    case "event_prep":
      return null;
    case "running_engine":
      return "Your running goal is supported through tempo and aerobic work within this HYROX block — station and strength pillars stay in place.";
    case "strength_support":
      return "Strength work supports HYROX durability and lean muscle. This remains a HYROX-specific programme, not a bodybuilding block.";
    case "fat_loss_support":
      return "Consistency, aerobic volume and HYROX structure support fat-loss goals. Nutrition and recovery habits matter most — training identity stays HYROX-specific.";
    case "general_fitness":
      return "General fitness is built through the HYROX block structure — threshold, aerobic base, stations and compromised work.";
    default:
      return null;
  }
}

export function extractHyroxGoalContext(
  assessment: AthleteAssessmentRowForProgramme
): HyroxGoalContext {
  const secondary_goal_raw = assessment.goal_focus?.trim() || null;
  const secondary_goal_kind = classifySecondaryGoal(secondary_goal_raw);
  const emphasise_running_support =
    secondary_goal_kind === "running_engine" ||
    /running|engine/.test((assessment.biggest_limiter ?? "").toLowerCase());

  return {
    primary_goal: HYROX_PRIMARY,
    secondary_goal_raw,
    secondary_goal_kind,
    secondary_goal_support_note: secondaryGoalSupportNote(secondary_goal_kind),
    emphasise_running_support,
  };
}

/** Guardrail: general assessment goal must never become the HYROX builder's primary identity. */
export function assertHyroxPrimaryGoal(context: HyroxGoalContext): HyroxPrimaryGoal {
  return context.primary_goal === HYROX_PRIMARY ? HYROX_PRIMARY : HYROX_PRIMARY;
}
