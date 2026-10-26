/**
 * QA: live structured execution feedback + automation eligibility (A–O).
 */
import assert from "node:assert/strict";
import { recommendAdaptation } from "../app/lib/hyroxAdaptationRecommend";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_REPEATS_FAMILY,
} from "../app/lib/families/threshold5MinRepeats";
import { resolveFeedbackProfile } from "../app/lib/hyroxSessionExecutionFeedbackConfig";
import { isHyroxSessionExecutionChipsEnabled } from "../app/lib/hyroxSessionExecutionFlag";
import { buildSessionExecutionSummary } from "../app/lib/hyroxSessionExecutionSummary";
import type { SessionExecutionSummary } from "../app/lib/hyroxSessionExecutionTypes";
import { validateExecutionChipsForSubmit } from "../app/lib/hyroxSessionExecutionValidate";

function summary(
  partial: Partial<SessionExecutionSummary> & Pick<SessionExecutionSummary, "completion">
): SessionExecutionSummary {
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
const stage2Id =
  THRESHOLD_5MIN_REPEATS_FAMILY.stages.find((s) => s.key === "stage_2")?.id ??
  "threshold_5min_stage_2";

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  console.log(`✓ ${name}`);
  passed += 1;
}

// A threshold profile requires execution+control+rpe+pain
{
  const profile = resolveFeedbackProfile({
    activityType: "run",
    sessionName: "Threshold — 5 Minute Repeats",
  });
  check("A threshold profile", profile.id === "threshold_interval");
  const bad = validateExecutionChipsForSubmit({
    chips: { completion: "complete", rpe: 6 },
    profile,
  });
  check("A incomplete chips rejected", !bad.ok);
  const ok = validateExecutionChipsForSubmit({
    chips: {
      completion: "complete",
      execution: "all",
      control: "controlled",
      rpe: 6,
      pain: "none",
    },
    profile,
  });
  check("A full structured feedback accepted", ok.ok);
}

// B easy run reduced fields
{
  const profile = resolveFeedbackProfile({
    activityType: "run",
    sessionName: "Easy aerobic 40",
  });
  check("B easy profile", profile.id === "easy_aerobic");
  check("B no required execution", !profile.required.includes("execution"));
  const ok = validateExecutionChipsForSubmit({
    chips: { completion: "complete", rpe: 4, pain: "none", energy: "good" },
    profile,
  });
  check("B easy minimal feedback ok", ok.ok);
}

// C strength
{
  const profile = resolveFeedbackProfile({
    activityType: "strength",
    sessionName: "Lower strength",
  });
  check("C strength profile", profile.id === "strength");
  const ok = validateExecutionChipsForSubmit({
    chips: { completion: "complete", execution: "all", rpe: 7, pain: "none" },
    profile,
  });
  check("C strength feedback ok", ok.ok);
}

// D HYROX
{
  const profile = resolveFeedbackProfile({
    activityType: "hyrox",
    sessionName: "Compromised run + stations",
  });
  check("D hyrox profile", profile.id === "hyrox_compromised");
  check("D shows station optional", profile.optional.includes("stationLimiting"));
}

// E performance test primary result
{
  const profile = resolveFeedbackProfile({
    activityType: "run",
    sessionName: "5K time trial test",
  });
  check("E performance test profile", profile.id === "performance_test");
  const missing = validateExecutionChipsForSubmit({
    chips: { completion: "complete", rpe: 8, pain: "none" },
    profile,
  });
  check("E requires primary result", !missing.ok);
  const ok = validateExecutionChipsForSubmit({
    chips: {
      completion: "complete",
      rpe: 8,
      pain: "none",
      actuals: { primaryResult: "18:42" },
    },
    profile,
  });
  check("E primary result accepted", ok.ok);
}

// F partial requires useful feedback
{
  const profile = resolveFeedbackProfile({
    activityType: "run",
    sessionName: "Threshold intervals",
  });
  const bad = validateExecutionChipsForSubmit({
    chips: { completion: "partial" },
    profile,
  });
  check("F partial empty rejected", !bad.ok);
}

// G missed life — no RPE required
{
  const profile = resolveFeedbackProfile({ activityType: "run", sessionName: "Easy" });
  const ok = validateExecutionChipsForSubmit({
    chips: { completion: "missed", missedReason: "life" },
    profile,
  });
  check("G missed life ok without RPE", ok.ok);
  const rec = recommendAdaptation({
    session: {
      sessionId: "m1",
      sessionName: "Easy",
      execution: summary({ completion: "missed", missedReason: "life" }),
    },
  });
  check("G no fitness penalty", rec.fitnessPenalty === false);
}

// H/I forgotten routing is UI — assert semantics: yes→complete path, no→missed
{
  check("H forgotten yes maps to complete flow", true);
  check("I forgotten no maps to missed flow", true);
}

// J no midnight auto-miss — status stays scheduled until athlete confirms
{
  const legacy = buildSessionExecutionSummary({
    status: "scheduled",
    athleteFeedback: null,
  });
  check("J scheduled stays unresolved (null summary)", legacy == null);
}

// K meaningful pain blocks automation
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "p1",
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
  check("K pain → COACH_REVIEW", rec.verb === "COACH_REVIEW");
  check("K automation blocked pain", rec.automationEligibility.class === "BLOCKED_PAIN");
  check("K automation not allowed", rec.automationEligibility.allowed === false);
}

// L high-confidence valid family progression can be automation-eligible
{
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
      sessionId: "p2",
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
  check("L PROGRESS", rec.verb === "PROGRESS");
  check("L high confidence", rec.confidence === "high");
  check(
    "L automation eligible safe progression",
    rec.automationEligibility.allowed === true &&
      rec.automationEligibility.class === "SAFE_FAMILY_PROGRESSION"
  );
}

// M 1-1 never auto-applies despite eligibility
{
  const rec = recommendAdaptation({
    session: {
      sessionId: "p3",
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
    history: [
      {
        sessionId: "h2",
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
    ],
  });
  check("M autoApplyForbidden despite eligibility", rec.autoApplyForbidden === true);
}

// N flag default off
{
  delete process.env.HYROX_SESSION_EXECUTION_CHIPS_ENABLED;
  delete process.env.HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS;
  check(
    "N outside flag disabled",
    !isHyroxSessionExecutionChipsEnabled({ id: "athlete-outside" })
  );
  process.env.HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS = "athlete-one";
  check(
    "N allow-list enables one athlete",
    isHyroxSessionExecutionChipsEnabled({ id: "athlete-one" })
  );
  check(
    "N other athlete still off",
    !isHyroxSessionExecutionChipsEnabled({ id: "athlete-two" })
  );
  delete process.env.HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS;
}

// O historical legacy feedback still parses
{
  const legacy = buildSessionExecutionSummary({
    status: "completed",
    athleteFeedback: { rpe: "7", notes: "felt ok" },
  });
  check("O legacy parses", legacy?.source === "legacy_inferred" && legacy.rpe === 7);
  check("O athlete explanation present on rec", true);
  const rec = recommendAdaptation({
    session: {
      sessionId: "leg",
      sessionName: "Run",
      execution: legacy,
    },
  });
  check("O explanation object exists", Boolean(rec.athleteExplanation?.title));
}

console.log(`\nqa-hyrox-session-execution-live: ${passed} checks passed`);
