/**
 * Coaching-engine productionisation E2E (fixture / pure — no production mutation).
 * Mirrors real 1-1 flow: anchors → week → feedback → adaptation → composer → draft apply → edit → no auto-publish.
 *
 * Run: npx tsx scripts/qa-hyrox-coaching-engine-e2e.ts
 */

import { THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS } from "../app/lib/families/threshold5MinRepeats";
import {
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "../app/lib/families/hyroxCompromisedRun";
import { BIKE_FTP_QUALITY_FAMILY } from "../app/lib/families/bikeFtpQuality";
import { FARMERS_CARRY_DURABILITY_FAMILY } from "../app/lib/families/farmersCarryDurability";
import { STRENGTH_UPPER_FOUNDATION_FAMILY } from "../app/lib/families/strengthUpperFoundation";
import { recommendAdaptation } from "../app/lib/hyroxAdaptationRecommend";
import { assessAutomationEligibility } from "../app/lib/hyroxAdaptationAutomationPolicy";
import type { SessionExecutionSummary } from "../app/lib/hyroxSessionExecutionTypes";
import {
  athleteFacingSessionFamilyTitle,
  sanitizeAthleteSessionTitle,
} from "../app/lib/hyroxSessionFamilyAthleteCopy";
import { listSessionFamilies } from "../app/lib/hyroxSessionFamilyRegistry";
import { assertValidSessionFamily } from "../app/lib/hyroxSessionFamilyValidate";
import { applyWeekProposalToDraft } from "../app/lib/hyroxWeekComposerApply";
import {
  buildFixtureComposerContext,
  buildFixtureSourceDraft,
  fixturePerformanceProfile,
} from "../app/lib/hyroxWeekComposerFixtures";
import {
  acceptProposalSession,
  proposeWeek,
  rejectProposalSession,
} from "../app/lib/hyroxWeekComposerPropose";
import { buildLibraryGapDashboard } from "../app/lib/hyroxLibraryGapDashboard";
import type { CoachDraftSession } from "../app/lib/hyroxCoachProgrammeDraft";

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`✗ ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${name}`);
  passed += 1;
}

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

const profile = fixturePerformanceProfile();
check("1 active anchors present", Boolean(profile.threshold?.paceSecondsPerKm));

for (const f of [BIKE_FTP_QUALITY_FAMILY, FARMERS_CARRY_DURABILITY_FAMILY, STRENGTH_UPPER_FOUNDATION_FAMILY]) {
  assertValidSessionFamily(f);
}
check("2 bike family registered", listSessionFamilies().some((f) => f.id === "bike_ftp_quality"));
check("2b farmers registered", listSessionFamilies().some((f) => f.id === "farmers_carry_durability"));
check("2c upper strength registered", listSessionFamilies().some((f) => f.id === "strength_upper_foundation"));

{
  const thRec = recommendAdaptation({
    session: {
      sessionId: "s-tue",
      sessionName: "Threshold Intervals",
      familyId: THRESHOLD_5MIN_FAMILY_ID,
      stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 6,
        control: "controlled",
        pain: "none",
      }),
    },
  });
  check("3 threshold PROGRESS", thRec.verb === "PROGRESS");
  check("3b autoApplyForbidden", thRec.autoApplyForbidden === true);

  const hxRec = recommendAdaptation({
    session: {
      sessionId: "s-sat",
      sessionName: "Compromised Running",
      familyId: HYROX_COMPROMISED_RUN_FAMILY_ID,
      stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s3,
      execution: summary({
        completion: "complete",
        execution: "all",
        rpe: 9,
        control: "hard",
        pain: "none",
      }),
    },
  });
  check("4 HYROX REPEAT/REDUCE", hxRec.verb === "REPEAT" || hxRec.verb === "REDUCE");
}

{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  ctx.instruction.structured.reduceDays = ["Sat"];
  ctx.instruction.structured.progressDays = ["Tue"];
  const proposal = proposeWeek(ctx);
  check("5 composer generates proposal", proposal.sessions.length >= 5);
  check("5b never auto-apply flag", proposal.autoApplyForbidden === true);

  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue" || s.day === "Tue");
  const sat = proposal.sessions.find((s) => s.sourceSessionId === "s-sat" || s.day === "Sat");
  check("6 threshold proposal present", Boolean(tue));
  check("7 HYROX proposal present", Boolean(sat));

  let selected = proposal;
  for (const s of proposal.sessions) {
    if (s.proposalId === tue?.proposalId || s.proposalId === sat?.proposalId) {
      selected = acceptProposalSession(selected, s.proposalId);
    } else if (!s.locked) {
      selected = rejectProposalSession(selected, s.proposalId);
    }
  }

  const sourceDraft = buildFixtureSourceDraft(profile);
  const applied = applyWeekProposalToDraft({
    sourceDraft,
    request: {
      proposal: selected,
      acceptedProposalIds: selected.sessions
        .filter((s) => s.coachState === "accepted")
        .map((s) => s.proposalId),
      rejectedProposalIds: selected.sessions
        .filter((s) => s.coachState === "rejected")
        .map((s) => s.proposalId),
    },
    profile,
  });

  check("8 apply returns draft only", applied.published === false && applied.autoApplyForbidden === true);
  check("9 target week identity", applied.draftWeek.week === proposal.targetWeekNumber);
  check("10 same-day continuity default", applied.draftWeek.days.length === 7);
  check("11 selective apply applied some", applied.appliedProposalIds.length >= 1);
  check("12 selective apply skipped some", applied.skippedProposalIds.length >= 1);

  const day = applied.draftWeek.days.find((d) => d.sessions.length > 0);
  if (day?.sessions[0]) {
    const s = day.sessions[0] as CoachDraftSession;
    const before = s.title;
    s.title = `${sanitizeAthleteSessionTitle(before)} · coach note`;
    check("13 manual edit after apply", s.title.includes("coach note") && s.title !== before);
  } else {
    check("13 manual edit after apply", false);
  }

  let jargonOk = true;
  for (const d of applied.draftWeek.days) {
    for (const s of d.sessions) {
      const title = sanitizeAthleteSessionTitle(s.title);
      if (/\bStage\s*\d\b/i.test(title) || /\bBeginner\b/i.test(title) || /\bIntermediate\b/i.test(title)) {
        jargonOk = false;
      }
    }
  }
  check("14 athlete titles clean of stage jargon", jargonOk);

  const gapDash = buildLibraryGapDashboard(proposal);
  check("15 gap dashboard builds", Array.isArray(gapDash.coachGaps));
}

check(
  "16 bike athlete title",
  athleteFacingSessionFamilyTitle(BIKE_FTP_QUALITY_FAMILY) === "Bike Intervals"
);
check(
  "17 farmers athlete title",
  athleteFacingSessionFamilyTitle(FARMERS_CARRY_DURABILITY_FAMILY) === "Farmers Carry"
);
check(
  "18 upper athlete title",
  athleteFacingSessionFamilyTitle(STRENGTH_UPPER_FOUNDATION_FAMILY) === "Upper Strength"
);

{
  const safeProgress = assessAutomationEligibility({
    verb: "PROGRESS",
    confidence: "high",
    execution: summary({
      completion: "complete",
      execution: "all",
      rpe: 6,
      control: "controlled",
      pain: "none",
    }),
    suggestedNextStageId: THRESHOLD_5MIN_STAGE_IDS.s3,
    familyId: THRESHOLD_5MIN_FAMILY_ID,
    fitnessPenalty: false,
  });
  check(
    "19 SAFE_FAMILY_PROGRESSION classed",
    safeProgress.class === "SAFE_FAMILY_PROGRESSION"
  );

  const coachReq = assessAutomationEligibility({
    verb: "REPLACE",
    confidence: "high",
    execution: null,
    suggestedNextStageId: null,
    familyId: null,
    fitnessPenalty: false,
  });
  check(
    "20 REPLACE blocked unsafe",
    coachReq.allowed === false && coachReq.class === "BLOCKED_UNSAFE_VERB"
  );
}

console.log(`\ncoaching-engine-e2e: ${passed} checks`);
