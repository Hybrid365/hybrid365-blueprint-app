/**
 * Apply saved block review context to coach draft generation (next 4-week block).
 */

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  generateCoachDraftWeekForBlockCycle,
  globalWeekForBlock,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import {
  blockMetaForReview,
  blockWeekRange,
  type BlockReviewCompletionSummary,
  type HyroxBlockReviewCoachNotes,
  type HyroxBlockReviewNextRecommendation,
} from "@/app/lib/hyroxBlockReview";
import type { ProgrammeLengthWeeks } from "@/app/lib/hyroxProgrammeDates";
import {
  BLOCK_REVIEW_RECOMMENDATION_OPTIONS,
} from "@/app/lib/hyroxBlockReview";

export type BlockReviewGenerationPlan =
  | {
      kind: "generate_block";
      reviewedBlockNumber: number;
      nextBlockNumber: number;
      weeksStart: number;
      weeksEnd: number;
      nextBlockTitle: string;
    }
  | {
      kind: "retest_week";
      reviewedBlockNumber: number;
      globalWeekNumber: number;
      message: string;
    }
  | {
      kind: "unavailable";
      message: string;
    };

export type BlockReviewGenerationContext = {
  reviewedBlockNumber: number;
  recommendation: HyroxBlockReviewNextRecommendation;
  nextBlockFocus: string | null;
  coachNotes: HyroxBlockReviewCoachNotes;
  completionSummary: BlockReviewCompletionSummary;
  effectiveProfile: HyroxAthleteProfile;
  raceDate?: string | null;
  raceName?: string | null;
};

const LIMITER_FROM_TEXT: Record<string, CoachAthlete["programmeInputs"]["mainLimiter"]> = {
  running: "running",
  run: "running",
  station: "stations",
  stations: "stations",
  wall: "wall_balls",
  sled: "sled",
  erg: "ergs",
  ergs: "ergs",
  ski: "ergs",
  row: "ergs",
  recovery: "recovery",
  compromised: "compromised_running",
};

function mapTextToLimiter(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(LIMITER_FROM_TEXT)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

export function recommendationLabel(
  value: HyroxBlockReviewNextRecommendation | "" | null
): string {
  if (!value) return "—";
  return BLOCK_REVIEW_RECOMMENDATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function resolveNextBlockGenerationPlan(params: {
  reviewedBlockNumber: number;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  recommendation?: HyroxBlockReviewNextRecommendation | null;
}): BlockReviewGenerationPlan {
  const { reviewedBlockNumber, programmeLengthWeeks } = params;
  const maxBlocks = programmeLengthWeeks === 16 ? 4 : 3;

  if (reviewedBlockNumber < 1 || reviewedBlockNumber > maxBlocks) {
    return {
      kind: "unavailable",
      message: `Block ${reviewedBlockNumber} is outside this athlete's ${programmeLengthWeeks}-week programme.`,
    };
  }

  if (reviewedBlockNumber >= maxBlocks) {
    return {
      kind: "unavailable",
      message:
        "This is the final programme block. Use retest / recalibrate and athlete testing — no further block to generate.",
    };
  }

  const nextBlockNumber = reviewedBlockNumber + 1;

  if (reviewedBlockNumber === 3 && programmeLengthWeeks === 12) {
    if (params.recommendation === "retest_recalibrate") {
      return {
        kind: "retest_week",
        reviewedBlockNumber: 3,
        globalWeekNumber: 12,
        message:
          "12-week programme complete after Block 3. Generates a retest-focused draft for Week 12 only (published weeks are skipped).",
      };
    }
    return {
      kind: "unavailable",
      message:
        "After Block 3 on a 12-week plan, choose recommendation “Retest / recalibrate” to generate a Week 12 retest draft, or continue coaching without auto-generation.",
    };
  }

  const { weeksStart, weeksEnd } = blockWeekRange(nextBlockNumber);
  const { blockTitle } = blockMetaForReview(nextBlockNumber, programmeLengthWeeks);

  return {
    kind: "generate_block",
    reviewedBlockNumber,
    nextBlockNumber,
    weeksStart,
    weeksEnd,
    nextBlockTitle: blockTitle,
  };
}

function completionRate(summary: BlockReviewCompletionSummary): number {
  if (!summary.sessionsTotal) return 0;
  return summary.sessionsCompleted / summary.sessionsTotal;
}

/** Tune sandbox inputs from block review + Hybrid365 progression rules. */
export function applyBlockReviewToCoachAthlete(
  athlete: CoachAthlete,
  ctx: BlockReviewGenerationContext,
  targetBlock: 1 | 2 | 3
): CoachAthlete {
  const { completionSummary: s, recommendation, coachNotes, effectiveProfile } = ctx;
  const rate = completionRate(s);
  const avgRpe = s.averageRpe ?? 7;

  let recoveryStatus = athlete.programmeInputs.recoveryStatus;
  let sleepQuality = athlete.programmeInputs.sleepQuality;
  let weeklyRunKm = Math.max(
    effectiveProfile.currentWeeklyRunVolumeKm,
    athlete.programmeInputs.weeklyRunKm
  );
  let mainLimiter = athlete.programmeInputs.mainLimiter;
  let stationWeaknesses = [...athlete.programmeInputs.stationWeaknesses];
  let doubleSessionReadiness = athlete.programmeInputs.doubleSessionReadiness;
  let raceTimeline = athlete.programmeInputs.raceTimeline;

  if (rate < 0.55 || s.missedSessions >= 3) {
    recoveryStatus = "poor";
    sleepQuality = "poor";
  } else if (rate < 0.75 || avgRpe >= 8.5 || s.highRpeSessionCount >= 3) {
    recoveryStatus = recoveryStatus === "good" ? "average" : recoveryStatus;
  } else if (rate >= 0.85 && avgRpe <= 7.5 && s.highRpeSessionCount <= 1) {
    recoveryStatus = "good";
  }

  if (s.athleteContext.stationWeaknesses.length) {
    stationWeaknesses = [
      ...new Set([...stationWeaknesses, ...s.athleteContext.stationWeaknesses]),
    ];
  }

  switch (recommendation) {
    case "increase_load":
      if (recoveryStatus !== "poor" && rate >= 0.7) {
        weeklyRunKm = Math.round(weeklyRunKm * 1.08);
        if (doubleSessionReadiness === "not_ready" && effectiveProfile.doubleSessionReadiness !== "not_ready") {
          doubleSessionReadiness = "aerobic_double_only";
        }
      }
      break;
    case "hold_load":
      weeklyRunKm = Math.round(weeklyRunKm * 1.0);
      break;
    case "reduce_load":
      weeklyRunKm = Math.round(weeklyRunKm * 0.88);
      recoveryStatus = "poor";
      doubleSessionReadiness = "not_ready";
      break;
    case "shift_focus": {
      const focus =
        coachNotes.stationWeaknessFocus?.trim() ||
        coachNotes.currentPriorityFocus?.trim() ||
        ctx.nextBlockFocus?.trim() ||
        "";
      const mapped = focus ? mapTextToLimiter(focus) : null;
      if (mapped) mainLimiter = mapped;
      break;
    }
    case "race_specific_build":
      mainLimiter = "compromised_running";
      raceTimeline = ctx.raceDate ? "4" : "8";
      break;
    case "retest_recalibrate":
      recoveryStatus = "average";
      weeklyRunKm = Math.round(weeklyRunKm * 0.92);
      break;
    case "progress_as_planned":
    default:
      break;
  }

  if (coachNotes.recoveryInjuryConsiderations?.trim()) {
    recoveryStatus = "average";
  }

  if (effectiveProfile.mainLimiter) {
    const ml = effectiveProfile.mainLimiter.toLowerCase();
    if (ml.includes("station") || ml.includes("wall")) mainLimiter = "stations";
    else if (ml.includes("run") || ml.includes("engine")) mainLimiter = "running";
    else if (ml.includes("sled")) mainLimiter = "sled";
    else if (ml.includes("recovery")) mainLimiter = "recovery";
  }

  return {
    ...athlete,
    programmeBlock: targetBlock,
    blockFocus: ctx.nextBlockFocus?.trim() || blockMetaForReview(targetBlock).blockTitle,
    mainLimiter: s.athleteContext.mainLimiter ?? athlete.mainLimiter,
    secondaryLimiter: s.athleteContext.secondaryLimiter ?? athlete.secondaryLimiter,
    recoveryStatus:
      recoveryStatus === "good" ? "good" : recoveryStatus === "poor" ? "poor" : "moderate",
    recoveryRisk:
      s.athleteContext.recoveryRisk === "high" ||
      s.athleteContext.recoveryRisk === "low"
        ? s.athleteContext.recoveryRisk
        : athlete.recoveryRisk,
    keyFocus:
      coachNotes.currentPriorityFocus?.trim() ||
      coachNotes.nextBlockGoal?.trim() ||
      ctx.nextBlockFocus?.trim() ||
      athlete.keyFocus,
    thingsToAvoid:
      coachNotes.whatNeedsAdjusting?.trim() ||
      coachNotes.recoveryInjuryConsiderations?.trim() ||
      athlete.thingsToAvoid,
    programmeInputs: {
      ...athlete.programmeInputs,
      programmeBlock: targetBlock,
      mainLimiter,
      stationWeaknesses,
      weeklyRunKm,
      recoveryStatus,
      sleepQuality,
      doubleSessionReadiness,
      raceTimeline,
      abilityLevel: effectiveProfile.abilityLevel,
      weeklyTrainingHours: effectiveProfile.weeklyTrainingHours,
      trainingDays: effectiveProfile.trainingDays,
    },
  };
}

export function buildCoachNotesFromBlockReview(ctx: BlockReviewGenerationContext): {
  coachNote: string;
  athleteFacingNote: string;
} {
  const { coachNotes, recommendation, nextBlockFocus, completionSummary: s } = ctx;
  const lines: string[] = [
    `Generated from Block ${ctx.reviewedBlockNumber} review → ${recommendationLabel(recommendation)}.`,
    nextBlockFocus ? `Focus: ${nextBlockFocus}` : null,
    `Completion: ${s.sessionsCompleted}/${s.sessionsTotal} sessions (${Math.round(completionRate(s) * 100)}%).`,
    s.averageRpe != null ? `Avg logged RPE: ${s.averageRpe}.` : null,
    coachNotes.whatWentWell ? `Went well: ${coachNotes.whatWentWell}` : null,
    coachNotes.whatNeedsAdjusting ? `Adjust: ${coachNotes.whatNeedsAdjusting}` : null,
    coachNotes.nextBlockGoal ? `Next block goal: ${coachNotes.nextBlockGoal}` : null,
    coachNotes.runningProgressionNotes
      ? `Running notes: ${coachNotes.runningProgressionNotes}`
      : null,
    coachNotes.strengthLegEnduranceNotes
      ? `Strength/leg notes: ${coachNotes.strengthLegEnduranceNotes}`
      : null,
    coachNotes.recoveryInjuryConsiderations
      ? `Recovery/injury: ${coachNotes.recoveryInjuryConsiderations}`
      : null,
  ].filter(Boolean) as string[];

  const athleteFacing = [
    nextBlockFocus ? `This block: ${nextBlockFocus}` : null,
    coachNotes.nextBlockGoal,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    coachNote: lines.join("\n"),
    athleteFacingNote: athleteFacing,
  };
}

export function generateBlockDraftWeeksFromReview(
  athlete: CoachAthlete,
  ctx: BlockReviewGenerationContext,
  plan: Extract<BlockReviewGenerationPlan, { kind: "generate_block" }>
): CoachDraftWeek[] {
  const adjustedBase = applyBlockReviewToCoachAthlete(
    athlete,
    ctx,
    plan.nextBlockNumber as 1 | 2 | 3
  );
  const cycles: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  return cycles.map((cycle) => {
    const weekAthlete: CoachAthlete = {
      ...adjustedBase,
      blockWeek: cycle,
      programmeInputs: {
        ...adjustedBase.programmeInputs,
        blockWeek: cycle,
      },
    };
    const draft = generateCoachDraftWeekForBlockCycle(weekAthlete, cycle);
    return {
      ...draft,
      block: plan.nextBlockNumber,
      week: globalWeekForBlock(plan.nextBlockNumber as 1 | 2 | 3, cycle),
    };
  });
}

export function generateRetestWeekDraftFromReview(
  athlete: CoachAthlete,
  ctx: BlockReviewGenerationContext,
  globalWeekNumber: number
): CoachDraftWeek {
  const blockNumber = 3 as const;
  const cycle = 4 as const;
  const adjusted = applyBlockReviewToCoachAthlete(athlete, ctx, blockNumber);
  const retestAthlete: CoachAthlete = {
    ...adjusted,
    programmeBlock: blockNumber,
    blockWeek: cycle,
    programmeInputs: {
      ...adjusted.programmeInputs,
      programmeBlock: blockNumber,
      blockWeek: cycle,
      recoveryStatus: "average",
      raceTimeline: "race_week",
    },
  };
  const draft = generateCoachDraftWeekForBlockCycle(retestAthlete, cycle);
  return { ...draft, block: blockNumber, week: globalWeekNumber };
}
