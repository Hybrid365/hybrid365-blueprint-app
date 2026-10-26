/**
 * Week Composer MVP QA — A–Q (pure / fixture, no production mutation).
 */
import {
  THRESHOLD_5MIN_STAGE_IDS,
} from "../app/lib/families/threshold5MinRepeats";
import {
  applyWeekProposalToDraft,
  selectProposalSessions,
} from "../app/lib/hyroxWeekComposerApply";
import {
  buildFixtureComposerContext,
  buildFixtureSourceDraft,
  fixturePerformanceProfile,
} from "../app/lib/hyroxWeekComposerFixtures";
import { isHyroxWeekComposerEnabled } from "../app/lib/hyroxWeekComposerFlag";
import {
  acceptProposalSession,
  proposeWeek,
  rejectProposalSession,
} from "../app/lib/hyroxWeekComposerPropose";
import { buildLibraryGapDashboard } from "../app/lib/hyroxLibraryGapDashboard";

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

const profile = fixturePerformanceProfile();

// A — preserve stable weekly structure
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const days = proposal.sessions.map((s) => s.day);
  check(
    "A preserve stable weekly structure",
    days.includes("Mon") &&
      days.includes("Tue") &&
      days.includes("Wed") &&
      days.includes("Thu") &&
      days.includes("Fri") &&
      days.includes("Sat") &&
      days.includes("Sun")
  );
}

// B — threshold valid PROGRESS edge
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check("B threshold PROGRESS", tue?.action === "PROGRESS");
  check(
    "B Stage 2 → Stage 3",
    tue?.fromStageId === THRESHOLD_5MIN_STAGE_IDS.s2 &&
      tue?.toStageId === THRESHOLD_5MIN_STAGE_IDS.s3
  );
}

// C — REPEAT keeps stage
{
  const ctx = buildFixtureComposerContext();
  // Force REPEAT via recommendation by using keep on tue and no progress
  const proposal = proposeWeek(ctx);
  // Manually simulate: reject progress path — use instruction keep
  const ctxKeep = buildFixtureComposerContext({});
  ctxKeep.instruction.structured.keepDays = ["Tue"];
  ctxKeep.instruction.structured.progressDays = [];
  const p2 = proposeWeek(ctxKeep);
  const tue = p2.sessions.find((s) => s.sourceSessionId === "s-tue");
  check(
    "C KEEP/REPEAT same stage",
    tue?.toStageId === THRESHOLD_5MIN_STAGE_IDS.s2 &&
      (tue?.action === "KEEP" || tue?.action === "REPEAT")
  );
  void proposal;
}

// D — REDUCE uses valid family edge
{
  const ctx = buildFixtureComposerContext();
  ctx.instruction.structured.progressDays = [];
  ctx.instruction.structured.reduceDays = ["Tue"];
  // Clear adaptation progress by keeping recommendation but instruction wins reduce
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check("D REDUCE action", tue?.action === "REDUCE");
  check(
    "D REDUCE edge to stage 1",
    tue?.toStageId === THRESHOLD_5MIN_STAGE_IDS.s1
  );
}

// E — missing family reports library gap (Thu still unlinked)
{
  const ctx = buildFixtureComposerContext({ progressTue: false });
  ctx.instruction.structured.reduceDays = ["Thu"];
  ctx.instruction.structured.progressDays = [];
  const proposal = proposeWeek(ctx);
  const thu = proposal.sessions.find((s) => s.sourceSessionId === "s-thu");
  check(
    "E missing family reports library gap",
    Boolean(thu?.libraryGap) &&
      proposal.libraryGaps.some((g) => g.code === "no_family")
  );
}

// F — coach target override preserved
{
  const ctx = buildFixtureComposerContext({
    progressTue: true,
    coachOverridePace: "4:00/km",
  });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check(
    "F coach target override preserved",
    tue?.targetPreview === "4:00/km" &&
      tue?.reasons.some((r) => /override/i.test(r)) === true
  );
}

// G — current active anchors resolve prescription (preview present)
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check("G anchors resolve target preview", tue?.targetPreview === "3:55/km");
}

// H — no silent missing-anchor estimate
{
  const ctx = buildFixtureComposerContext({
    progressTue: true,
    missingThresholdAnchor: true,
  });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check(
    "H no silent missing-anchor estimate",
    tue?.targetPreview == null && Boolean(tue?.targetMissingReason)
  );
}

// I — completed sessions cannot be changed in Remaining Week
{
  const ctx = buildFixtureComposerContext({
    mode: "remaining_week",
    tueCompleted: true,
    progressTue: true,
  });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue");
  check("I remaining week locks completed", Boolean(tue?.locked) && tue?.action === "KEEP");
}

// J — coach can reject single proposal
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  let proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue")!;
  proposal = rejectProposalSession(proposal, tue.proposalId);
  const after = proposal.sessions.find((s) => s.sourceSessionId === "s-tue")!;
  check("J reject single proposal", after.action === "KEEP" && after.coachState === "rejected");
}

// K — selective apply
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const tue = proposal.sessions.find((s) => s.sourceSessionId === "s-tue")!;
  const selected = selectProposalSessions(proposal, [tue.proposalId]);
  check(
    "K selective apply marks only chosen accepted",
    selected.sessions.filter((s) => s.coachState === "accepted").length === 1
  );
}

// L + M — full apply writes drafts only
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const accepted = acceptProposalSession(
    proposal,
    proposal.sessions.find((s) => s.sourceSessionId === "s-tue")!.proposalId
  );
  const sourceDraft = buildFixtureSourceDraft(profile);
  const result = applyWeekProposalToDraft({
    sourceDraft,
    request: { proposal: accepted },
    profile,
  });
  check("L full/selective apply ok", result.ok === true && result.appliedProposalIds.length >= 1);
  check("M apply writes drafts only published=false", result.published === false);
  check("M autoApplyForbidden", result.autoApplyForbidden === true);
  // Stage advanced on Tue draft
  const tueDay = result.draftWeek.days.find((d) => d.day === "Tue");
  const tueSess = tueDay?.sessions[0];
  check(
    "L applied stage is s3",
    tueSess?.sessionFamily?.stageId === THRESHOLD_5MIN_STAGE_IDS.s3
  );
}

// N — publish never happens automatically (contract on result)
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  check("N proposal never published flag", proposal.autoApplyForbidden === true);
}

// O — race/pain safety warnings
{
  const pain = proposeWeek(buildFixtureComposerContext({ painOnTue: true, progressTue: true }));
  const tuePain = pain.sessions.find((s) => s.sourceSessionId === "s-tue");
  check(
    "O pain blocks progress / requires coach",
    tuePain?.action !== "PROGRESS" && Boolean(tuePain?.requiresCoachJudgement)
  );
  const race = proposeWeek(buildFixtureComposerContext({ raceWeek: true, progressTue: true }));
  check(
    "O race week warnings",
    race.unresolvedWarnings.some((w) => /race/i.test(w))
  );
}

// P — 1-1 decisionAuthority remains coach
{
  const proposal = proposeWeek(buildFixtureComposerContext());
  check("P decisionAuthority coach", proposal.decisionAuthority === "coach");
}

// Q — historical published week unchanged (apply clones to target week)
{
  const ctx = buildFixtureComposerContext({ progressTue: true });
  const proposal = proposeWeek(ctx);
  const sourceDraft = buildFixtureSourceDraft(profile);
  const sourceStage = sourceDraft.days
    .find((d) => d.day === "Tue")
    ?.sessions[0]?.sessionFamily?.stageId;
  const result = applyWeekProposalToDraft({
    sourceDraft,
    request: { proposal },
    profile,
  });
  check(
    "Q source draft object not mutated in place via clone target week",
    result.draftWeek.week === proposal.targetWeekNumber &&
      sourceDraft.week === 6 &&
      sourceStage === THRESHOLD_5MIN_STAGE_IDS.s2
  );
}

// Flag default off
{
  delete process.env.HYROX_WEEK_COMPOSER_ENABLED;
  delete process.env.HYROX_WEEK_COMPOSER_ATHLETE_IDS;
  delete process.env.HYROX_WEEK_COMPOSER_DEV_ALL;
  check("flag default off", isHyroxWeekComposerEnabled({ id: "any" }) === false);
  process.env.HYROX_WEEK_COMPOSER_ATHLETE_IDS = "athlete-one";
  check("flag allow-list one", isHyroxWeekComposerEnabled({ id: "athlete-one" }) === true);
  check("flag other still off", isHyroxWeekComposerEnabled({ id: "athlete-two" }) === false);
  delete process.env.HYROX_WEEK_COMPOSER_ATHLETE_IDS;
}

// R — library gap dashboard coach-facing (no raw noise required)
{
  const ctx = buildFixtureComposerContext();
  ctx.instruction.structured.reduceDays = ["Thu"];
  const proposal = proposeWeek(ctx);
  const dash = buildLibraryGapDashboard(proposal);
  check("R gap dashboard coach gaps array", Array.isArray(dash.coachGaps));
  check(
    "R coach titles human",
    dash.coachGaps.every((g) => g.title.length > 3 && !g.title.includes("_"))
  );
}

console.log(`\nqa-hyrox-week-composer: ${passed} checks passed`);
