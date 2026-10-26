/**
 * QA: Feedback → Adaptation foundation (A–K).
 * Pure domain — no DB mutation, no programme mutation.
 */
import assert from "node:assert/strict";
import {
  applyCoachDecisionOverride,
  mapVerbToAllowedFamilyTransition,
  recommendAdaptation,
} from "../app/lib/hyroxAdaptationRecommend";
import { buildWeeklyAdaptationSlice } from "../app/lib/hyroxAdaptationWeeklyReview";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_REPEATS_FAMILY,
} from "../app/lib/families/threshold5MinRepeats";
import { buildSessionExecutionSummary } from "../app/lib/hyroxSessionExecutionSummary";
import type { SessionExecutionSummary } from "../app/lib/hyroxSessionExecutionTypes";

function summary(partial: Partial<SessionExecutionSummary> & Pick<SessionExecutionSummary, "completion">): SessionExecutionSummary {
  return {
    execution: null,
    rpe: null,
    control: null,
    pain: null,
    energy: null,
    legs: null,
    athleteNote: null,
    missedReason: null,
    actuals: null,
    source: "structured",
    ...partial,
  };
}

const familyId = THRESHOLD_5MIN_FAMILY_ID;
const stage2 = THRESHOLD_5MIN_REPEATS_FAMILY.stages.find((s) => s.key === "stage_2");
const stage2Id = stage2?.id ?? "threshold_5min_stage_2";
assert.ok(stage2Id, "stage 2 id");

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  console.log(`✓ ${name}`);
  passed += 1;
}

// A. completed + easy/control + all targets → progress
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-a",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
      }),
    },
  });
  check("A completed + easy/control + all targets → PROGRESS", rec.verb === "PROGRESS");
  check("A suggested next stage present", Boolean(rec.suggestedNext?.toStageId));
  check("A autoApplyForbidden", rec.autoApplyForbidden === true);
}

// B. completed + hard → repeat
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-b",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 8,
        control: "hard",
        pain: "none",
      }),
    },
  });
  check("B completed + hard → REPEAT", rec.verb === "REPEAT");
}

// C. partial + hard → reduce/repeat
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-c",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "partial",
        execution: "some",
        rpe: 9,
        control: "hard",
        pain: "none",
      }),
    },
  });
  check("C partial + hard → REDUCE or REPEAT", rec.verb === "REDUCE" || rec.verb === "REPEAT");
}

// D. missed due to life → no fitness penalty
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-d",
      sessionName: "Easy run",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "missed",
        missedReason: "life",
      }),
    },
  });
  check("D missed life → KEEP", rec.verb === "KEEP");
  check("D no fitness penalty", rec.fitnessPenalty === false);
}

// E. pain meaningful → coach review
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-e",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "meaningful",
      }),
    },
  });
  check("E pain meaningful → COACH_REVIEW", rec.verb === "COACH_REVIEW");
  check("E escalate", rec.escalateToCoach === true);
  check("E reasons mention no diagnosis", rec.reasons.some((r) => /diagnos/i.test(r)));
}

// F. missing feedback → low-confidence / no aggressive progression
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-f",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: null,
    },
  });
  check("F missing feedback → KEEP", rec.verb === "KEEP");
  check("F low confidence", rec.confidence === "low");
}

// G. family transition respects allowed edge
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-g",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "very_controlled",
        pain: "none",
      }),
    },
  });
  check("G PROGRESS edge legal", rec.verb === "PROGRESS" && Boolean(rec.suggestedNext?.toStageId));
  const mapped = mapVerbToAllowedFamilyTransition({
    familyId,
    fromStageId: stage2Id!,
    desired: "PROGRESS",
  });
  check("G mapped PROGRESS has target", mapped.suggestedNext?.toStageId != null);
}

// H. invalid transition impossible
{
  const mapped = mapVerbToAllowedFamilyTransition({
    familyId,
    fromStageId: stage2Id!,
    desired: "CHANGE_TARGET",
  });
  check("H CHANGE_TARGET not a family edge → KEEP", mapped.verb === "KEEP");
  const fake = mapVerbToAllowedFamilyTransition({
    familyId,
    fromStageId: "nonexistent_stage",
    desired: "PROGRESS",
  });
  check("H nonexistent stage → COACH_REVIEW", fake.verb === "COACH_REVIEW");
}

// I. coach decision overrides recommendation
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-i",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
      }),
    },
  });
  const { decision, programmeModified } = applyCoachDecisionOverride({
    recommendation: rec,
    coachVerb: "REPEAT",
    decidedAt: "2026-10-25T12:00:00.000Z",
    decidedByUserId: "coach-1",
  });
  check("I coach overrides to REPEAT", decision.coachVerb === "REPEAT");
  check("I recommended verb preserved", decision.recommendedVerb === "PROGRESS");
  check("I programme not modified by decision", programmeModified === false);
}

// J. historical recommendation remains auditable
{
  const slice = buildWeeklyAdaptationSlice({
    sessions: [
      {
        sessionId: "s-j",
        sessionName: "Threshold",
        dayOfWeek: "Tue",
        category: "run",
        status: "completed",
        isKeySession: true,
        plannedDurationMinutes: 55,
        actualRunKm: 8,
        execution: summary({
          completion: "complete",
          execution: "all",
          rpe: 6,
          control: "controlled",
          pain: "none",
        }),
        familyId,
        stageId: stage2Id,
        stageLabel: stage2?.label ?? "Stage 2",
        athleteNote: null,
      },
    ],
    decisions: [
      {
        id: "decision:s-j:2026-10-20T10:00:00.000Z",
        sessionId: "s-j",
        recommendedVerb: "PROGRESS",
        recommendedConfidence: "medium",
        recommendedReasons: ["prior"],
        coachVerb: "REPEAT",
        finalToStageId: stage2Id!,
        finalToStageLabel: "Stage 2",
        decidedAt: "2026-10-20T10:00:00.000Z",
        decidedByUserId: "coach-1",
        note: null,
        programmeModified: false,
      },
    ],
  });
  check("J decisions retained in slice", slice.decisions.length === 1);
  check("J historical coachVerb still REPEAT", slice.decisions[0].coachVerb === "REPEAT");
}

// K. no programme is modified automatically
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-k",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 5,
        control: "very_controlled",
        pain: "none",
      }),
    },
  });
  check("K recommendation forbids auto-apply", rec.autoApplyForbidden === true);
  const { programmeModified } = applyCoachDecisionOverride({
    recommendation: rec,
    coachVerb: "PROGRESS",
    decidedAt: "2026-10-25T12:00:00.000Z",
  });
  check("K decision helper never mutates programme", programmeModified === false);
}

// Bonus: legacy inferred summary + high confidence with history
{
  const legacy = buildSessionExecutionSummary({
    status: "completed",
    athleteFeedback: { rpe: "7", notes: "felt ok" },
  });
  check("legacy summary source", legacy?.source === "legacy_inferred");
  const history = [
    {
      sessionId: "h1",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
      }),
    },
  ];
  const rec = recommendAdaptation({
    session: {
      sessionId: "s-hist",
      sessionName: "Threshold",
      familyId,
      stageId: stage2Id,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
      }),
    },
    history,
  });
  check("multi-exposure can raise confidence to high", rec.confidence === "high");
}

console.log(`\nqa-hyrox-adaptation-engine: ${passed} checks passed`);
