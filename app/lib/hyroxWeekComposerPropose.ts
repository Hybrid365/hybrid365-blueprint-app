/**
 * Deterministic Week Composer proposal engine.
 * Preserves weekly structure. Never invents anchors, stages, or library sessions.
 * Never mutates programmes.
 */

import type { AdaptationRecommendation } from "@/app/lib/hyroxAdaptationTypes";
import { mapVerbToAllowedFamilyTransition } from "@/app/lib/hyroxAdaptationRecommend";
import { describeStageStructure } from "@/app/lib/hyroxSessionFamilyApply";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import {
  instructionForcesKeep,
  instructionForcesProgress,
  instructionForcesReduce,
  instructionMoveForSession,
  instructionRestDay,
  mergeInstructionWithFreeTextHints,
} from "@/app/lib/hyroxWeekComposerInstruction";
import type {
  ComposerAction,
  ComposerAthleteChangeMessage,
  ComposerDifference,
  ComposerLibraryGap,
  ProposedComposerSession,
  WeekComposerContext,
  WeekComposerSessionSlot,
  WeekComposerWeekday,
  WeekProposal,
} from "@/app/lib/hyroxWeekComposerTypes";
import { verbToComposerAction } from "@/app/lib/hyroxWeekComposerTypes";

function proposalId(day: string, sessionId: string, action: string): string {
  return `prop-${day}-${sessionId}-${action}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function findRecommendation(
  recommendations: AdaptationRecommendation[],
  sessionId: string
): AdaptationRecommendation | null {
  return recommendations.find((r) => r.sessionId === sessionId) ?? null;
}

function resolveTargetPreview(
  familyId: string | null,
  stageId: string | null,
  anchorsPresent: boolean,
  existingTarget: string | null,
  coachOverride: boolean
): { preview: string | null; missingReason: string | null } {
  if (coachOverride && existingTarget) {
    return { preview: existingTarget, missingReason: null };
  }
  if (familyId && stageId && !anchorsPresent) {
    return {
      preview: null,
      missingReason: "Required programming anchor missing — no pace estimated",
    };
  }
  return { preview: existingTarget, missingReason: null };
}

function buildDifference(args: {
  action: ComposerAction;
  fromLabel: string | null;
  toLabel: string | null;
  fromTarget: string | null;
  toTarget: string | null;
  fromDay: WeekComposerWeekday;
  toDay: WeekComposerWeekday;
}): ComposerDifference {
  const { action, fromLabel, toLabel, fromTarget, toTarget, fromDay, toDay } = args;
  if (action === "KEEP" || action === "REPEAT") {
    return { kind: "unchanged", before: fromLabel, after: toLabel ?? fromLabel };
  }
  if (action === "PROGRESS") {
    return { kind: "progressed", before: fromLabel, after: toLabel };
  }
  if (action === "REDUCE") {
    return { kind: "reduced", before: fromLabel, after: toLabel };
  }
  if (action === "MOVE") {
    return { kind: "moved", before: fromDay, after: toDay };
  }
  if (action === "REPLACE") {
    return { kind: "replaced", before: fromLabel, after: toLabel };
  }
  if (action === "REMOVE") {
    return { kind: "removed", before: fromLabel, after: null };
  }
  if (action === "ADD") {
    return { kind: "added", before: null, after: toLabel };
  }
  if (action === "CHANGE_TARGET") {
    return { kind: "target_change", before: fromTarget, after: toTarget };
  }
  return { kind: "unchanged", before: fromLabel, after: toLabel };
}

function athleteMessageFor(
  action: ComposerAction,
  title: string,
  reasons: string[],
  fromLabel: string | null,
  toLabel: string | null
): ComposerAthleteChangeMessage | null {
  if (action === "KEEP" || action === "REPEAT") return null;
  if (action === "PROGRESS") {
    return {
      title: `${title.split("·")[0]?.trim() || "Session"} progressed`,
      message: `Last exposure supported progression${
        reasons.length ? ` (${reasons.slice(0, 3).join("; ")})` : ""
      }${fromLabel && toLabel ? `, so the session moves from ${fromLabel} to ${toLabel}.` : "."}`,
    };
  }
  if (action === "REDUCE") {
    return {
      title: "Dose reduced",
      message: `This week's exposure is reduced${
        toLabel ? ` to ${toLabel}` : ""
      } based on recent feedback.`,
    };
  }
  if (action === "MOVE") {
    return {
      title: "Session moved",
      message: "This session was moved to a different day in the week.",
    };
  }
  return null;
}

function thresholdAnchorPresent(ctx: WeekComposerContext): boolean {
  return ctx.anchors.some(
    (a) =>
      a.present &&
      (/threshold/i.test(a.key) || /threshold/i.test(a.label))
  );
}

function proposeForSlot(
  ctx: WeekComposerContext,
  slot: WeekComposerSessionSlot,
  instruction: WeekComposerContext["instruction"]
): ProposedComposerSession {
  const rec = findRecommendation(ctx.recommendations, slot.sessionId);
  // Remaining week: lock completed / past
  if (ctx.mode === "remaining_week" && (slot.completed || slot.isPast)) {
    return {
      proposalId: proposalId(slot.day, slot.sessionId, "LOCKED"),
      day: slot.day,
      dateYmd: slot.dateYmd,
      slot: slot.slot,
      action: "KEEP",
      title: slot.title,
      libraryEntryId: slot.libraryEntryId,
      familyId: slot.familyId,
      fromStageId: slot.stageId,
      fromStageLabel: slot.stageLabel,
      toStageId: slot.stageId,
      toStageLabel: slot.stageLabel,
      structureLine: slot.structureLine,
      targetPreview: slot.targetPreview,
      targetMissingReason: null,
      sourceSessionId: slot.sessionId,
      reasons: ["Completed or past session — Remaining Week cannot change it"],
      difference: {
        kind: "unchanged",
        before: slot.structureLine ?? slot.title,
        after: slot.structureLine ?? slot.title,
      },
      confidence: null,
      automationEligibility: null,
      requiresCoachJudgement: false,
      acceptedByDefault: true,
      locked: true,
      lockReason: "Completed/past sessions are immutable in Remaining Week mode",
      libraryGap: null,
      athleteChangeMessage: null,
      coachState: "accepted",
    };
  }

  if (instructionRestDay(instruction, slot.day) && slot.isKeySession) {
    return {
      proposalId: proposalId(slot.day, slot.sessionId, "REMOVE"),
      day: slot.day,
      dateYmd: slot.dateYmd,
      slot: slot.slot,
      action: "REMOVE",
      title: slot.title,
      libraryEntryId: slot.libraryEntryId,
      familyId: slot.familyId,
      fromStageId: slot.stageId,
      fromStageLabel: slot.stageLabel,
      toStageId: null,
      toStageLabel: null,
      structureLine: null,
      targetPreview: null,
      targetMissingReason: null,
      sourceSessionId: slot.sessionId,
      reasons: ["Coach marked this day rest / no intensity"],
      difference: {
        kind: "removed",
        before: slot.structureLine ?? slot.title,
        after: null,
      },
      confidence: "high",
      automationEligibility: null,
      requiresCoachJudgement: true,
      acceptedByDefault: false,
      locked: false,
      lockReason: null,
      libraryGap: null,
      athleteChangeMessage: {
        title: "Quality removed",
        message: "Intensity was removed from this day per coach instruction.",
      },
      coachState: "proposed",
    };
  }

  const moveTo = instructionMoveForSession(instruction, slot.day, slot.sessionId);

  let desiredAction: ComposerAction = "KEEP";
  const reasons: string[] = [];

  if (instructionForcesKeep(instruction, slot.day, slot.sessionId)) {
    desiredAction = "KEEP";
    reasons.push("Coach instruction: keep");
  } else if (instructionForcesProgress(instruction, slot.day, slot.sessionId)) {
    desiredAction = "PROGRESS";
    reasons.push("Coach instruction: progress");
  } else if (instructionForcesReduce(instruction, slot.day, slot.sessionId)) {
    desiredAction = "REDUCE";
    reasons.push("Coach instruction: reduce");
  } else if (rec) {
    desiredAction = verbToComposerAction(rec.verb);
    reasons.push(...rec.reasons);
  } else {
    reasons.push("No adaptation signal — preserve structure");
  }

  if (moveTo && moveTo !== slot.day) {
    desiredAction = "MOVE";
    reasons.push(`Coach instruction: move ${slot.day} → ${moveTo}`);
  }

  // Pain safety
  const painMeaningful = slot.execution?.pain === "meaningful" || rec?.escalateToCoach;
  if (painMeaningful && (desiredAction === "PROGRESS" || desiredAction === "CHANGE_TARGET")) {
    desiredAction = "KEEP";
    reasons.push("Meaningful pain / review flag — progression blocked; coach judgement required");
  }

  let toStageId = slot.stageId;
  let toStageLabel = slot.stageLabel;
  let structureLine = slot.structureLine;
  let libraryGap: ComposerLibraryGap | null = null;
  let requiresCoachJudgement = Boolean(painMeaningful || ctx.athlete.raceWeek);
  let action: ComposerAction = desiredAction;

  if (
    slot.familyId &&
    slot.stageId &&
    (desiredAction === "PROGRESS" ||
      desiredAction === "REDUCE" ||
      desiredAction === "REPEAT" ||
      desiredAction === "KEEP")
  ) {
    const familyVerb =
      desiredAction === "KEEP"
        ? "KEEP"
        : desiredAction === "PROGRESS"
          ? "PROGRESS"
          : desiredAction === "REDUCE"
            ? "REDUCE"
            : "REPEAT";

    if (familyVerb === "KEEP") {
      action = "KEEP";
      toStageId = slot.stageId;
      toStageLabel = slot.stageLabel;
    } else if (familyVerb === "REPEAT") {
      action = "REPEAT";
      toStageId = slot.stageId;
      toStageLabel = slot.stageLabel;
      reasons.push("REPEAT keeps the same Session Family stage");
    } else {
      const mapped = mapVerbToAllowedFamilyTransition({
        familyId: slot.familyId,
        fromStageId: slot.stageId,
        desired: familyVerb,
      });
      action = verbToComposerAction(mapped.verb);
      if (mapped.suggestedNext?.toStageId) {
        toStageId = mapped.suggestedNext.toStageId;
        toStageLabel = mapped.suggestedNext.toStageLabel;
        const family = getSessionFamily(slot.familyId);
        const stage = family?.stages.find((s) => s.id === toStageId);
        if (stage) structureLine = describeStageStructure(stage);
        reasons.push(...mapped.reasons);
      } else if (desiredAction === "PROGRESS" || desiredAction === "REDUCE") {
        libraryGap = {
          code: "no_valid_transition",
          message: `No suitable canonical library session — no valid ${desiredAction} edge from ${slot.stageLabel ?? slot.stageId}`,
          day: slot.day,
          sessionId: slot.sessionId,
          familyId: slot.familyId,
          desiredAction,
        };
        action = "KEEP";
        toStageId = slot.stageId;
        toStageLabel = slot.stageLabel;
        requiresCoachJudgement = true;
        reasons.push(libraryGap.message);
      }
    }
  } else if (
    !slot.familyId &&
    (desiredAction === "PROGRESS" || desiredAction === "REDUCE")
  ) {
    libraryGap = {
      code: "no_family",
      message: `No suitable canonical library session — no Session Family linked for ${slot.title}`,
      day: slot.day,
      sessionId: slot.sessionId,
      familyId: null,
      desiredAction,
    };
    action = "KEEP";
    requiresCoachJudgement = true;
    reasons.push(libraryGap.message);
  }

  if (moveTo && moveTo !== slot.day && action !== "REMOVE") {
    action = "MOVE";
  }

  const anchorsOk = thresholdAnchorPresent(ctx);
  const target = resolveTargetPreview(
    slot.familyId,
    toStageId,
    anchorsOk,
    slot.targetPreview,
    slot.coachTargetOverride
  );

  if (target.missingReason) {
    libraryGap =
      libraryGap ??
      ({
        code: "missing_anchor",
        message: target.missingReason,
        day: slot.day,
        sessionId: slot.sessionId,
        familyId: slot.familyId,
        desiredAction: action,
      } satisfies ComposerLibraryGap);
    requiresCoachJudgement = true;
  }

  if (slot.coachTargetOverride) {
    reasons.push("Coach target override preserved");
  }

  if (ctx.athlete.raceWeek) {
    reasons.push("Race/taper week — coach judgement required");
    requiresCoachJudgement = true;
  }

  const dayOut = moveTo && action === "MOVE" ? moveTo : slot.day;
  const difference = buildDifference({
    action,
    fromLabel: slot.structureLine ?? slot.stageLabel ?? slot.title,
    toLabel: structureLine ?? toStageLabel ?? slot.title,
    fromTarget: slot.targetPreview,
    toTarget: target.preview,
    fromDay: slot.day,
    toDay: dayOut,
  });

  const athleteChangeMessage = athleteMessageFor(
    action,
    slot.title,
    reasons,
    slot.structureLine ?? slot.stageLabel,
    structureLine ?? toStageLabel
  );

  return {
    proposalId: proposalId(slot.day, slot.sessionId, action),
    day: dayOut,
    dateYmd: slot.dateYmd,
    slot: slot.slot,
    action,
    title: slot.title,
    libraryEntryId: slot.libraryEntryId,
    familyId: slot.familyId,
    fromStageId: slot.stageId,
    fromStageLabel: slot.stageLabel,
    toStageId,
    toStageLabel,
    structureLine: structureLine ?? slot.structureLine,
    targetPreview: target.preview,
    targetMissingReason: target.missingReason,
    sourceSessionId: slot.sessionId,
    reasons,
    difference,
    confidence: rec?.confidence ?? (action === "KEEP" ? "medium" : null),
    automationEligibility: rec?.automationEligibility ?? null,
    requiresCoachJudgement,
    acceptedByDefault: !requiresCoachJudgement && action !== "REMOVE",
    locked: false,
    lockReason: null,
    libraryGap,
    athleteChangeMessage,
    coachState: "proposed",
  };
}

function sumPlannedKm(sessions: WeekComposerSessionSlot[]): number | null {
  let sum = 0;
  let any = false;
  for (const s of sessions) {
    if (s.plannedRunKm != null) {
      sum += s.plannedRunKm;
      any = true;
    }
  }
  return any ? Math.round(sum * 10) / 10 : null;
}

function estimateProposedKm(
  source: WeekComposerSessionSlot[],
  proposed: ProposedComposerSession[],
  instruction: WeekComposerContext["instruction"]
): number | null {
  const structured = instruction.structured;
  if (structured.runVolumeKmMin != null && structured.runVolumeKmMax != null) {
    return Math.round(((structured.runVolumeKmMin + structured.runVolumeKmMax) / 2) * 10) / 10;
  }
  const base = sumPlannedKm(source);
  if (base == null) return null;
  let delta = 0;
  for (const p of proposed) {
    if (p.action === "PROGRESS") delta += 0.5;
    if (p.action === "REDUCE" || p.action === "REMOVE") delta -= 1;
  }
  return Math.round((base + delta) * 10) / 10;
}

/**
 * Build a WeekProposal from context. Pure. No DB. No publish.
 */
export function proposeWeek(ctx: WeekComposerContext): WeekProposal {
  const instruction = mergeInstructionWithFreeTextHints(ctx.instruction);
  const sessions = ctx.sourceWeek.sessions.map((slot) =>
    proposeForSlot({ ...ctx, instruction }, slot, instruction)
  );

  const libraryGaps = sessions
    .map((s) => s.libraryGap)
    .filter((g): g is ComposerLibraryGap => Boolean(g));

  const previousRunVolumeKm =
    ctx.weekly.plannedRunKm ?? sumPlannedKm(ctx.sourceWeek.sessions);
  const proposedRunVolumeKm = estimateProposedKm(
    ctx.sourceWeek.sessions,
    sessions,
    instruction
  );
  const runVolumeDeltaKm =
    previousRunVolumeKm != null && proposedRunVolumeKm != null
      ? Math.round((proposedRunVolumeKm - previousRunVolumeKm) * 10) / 10
      : null;

  const qualitySessionCount = sessions.filter((s) => {
    if (s.action === "REMOVE") return false;
    const src = ctx.sourceWeek.sessions.find((x) => x.sessionId === s.sourceSessionId);
    return Boolean(src?.isKeySession) || s.action === "PROGRESS" || s.action === "REPEAT";
  }).length;

  const notableChanges = sessions
    .filter((s) => s.action !== "KEEP" && !s.locked)
    .map((s) => `${s.day}: ${s.action} — ${s.title}`);

  const unresolvedWarnings: string[] = [];
  if (ctx.athlete.raceWeek) unresolvedWarnings.push("Race/taper week — review all quality carefully");
  for (const p of ctx.weekly.painFlags) {
    unresolvedWarnings.push(`Pain flag: ${p.sessionName} (${p.pain})`);
  }
  for (const g of libraryGaps) unresolvedWarnings.push(g.message);
  for (const s of sessions) {
    if (s.targetMissingReason) unresolvedWarnings.push(`${s.day}: ${s.targetMissingReason}`);
  }

  const sessionsRequiringCoachJudgement = sessions
    .filter((s) => s.requiresCoachJudgement)
    .map((s) => s.proposalId);

  const rationale = [
    ctx.mode === "next_week"
      ? "Preserving stable weekly day/slot structure from source week"
      : "Remaining Week — only upcoming sessions may change",
    "Session Family edges used when valid; otherwise library gap reported",
    "1-1 decisionAuthority=coach — proposal never auto-applies",
  ];
  if (instruction.freeText) rationale.push(`Coach instruction noted: ${instruction.freeText.slice(0, 120)}`);

  return {
    mode: ctx.mode,
    athleteId: ctx.athlete.id,
    sourceWeekNumber: ctx.sourceWeek.weekNumber,
    targetWeekNumber: ctx.athlete.targetWeek,
    decisionAuthority: "coach",
    autoApplyForbidden: true,
    sessions,
    proposedRunVolumeKm,
    previousRunVolumeKm,
    runVolumeDeltaKm,
    qualitySessionCount,
    notableChanges,
    unresolvedWarnings,
    sessionsRequiringCoachJudgement,
    libraryGaps,
    rationale,
  };
}

/** Reject a single proposal → KEEP original on its source day. */
export function rejectProposalSession(
  proposal: WeekProposal,
  proposalId: string
): WeekProposal {
  return {
    ...proposal,
    sessions: proposal.sessions.map((s) => {
      if (s.proposalId !== proposalId || s.locked) return s;
      const originalDay =
        s.difference.kind === "moved" && typeof s.difference.before === "string"
          ? (s.difference.before as WeekComposerWeekday)
          : s.day;
      return {
        ...s,
        action: "KEEP" as const,
        day: originalDay,
        toStageId: s.fromStageId,
        toStageLabel: s.fromStageLabel,
        structureLine: s.difference.before,
        coachState: "rejected" as const,
        acceptedByDefault: false,
        reasons: [...s.reasons, "Coach rejected proposal — keep original"],
        difference: {
          kind: "unchanged" as const,
          before: s.difference.before,
          after: s.difference.before,
        },
        athleteChangeMessage: null,
      };
    }),
  };
}

export function acceptProposalSession(
  proposal: WeekProposal,
  proposalId: string
): WeekProposal {
  return {
    ...proposal,
    sessions: proposal.sessions.map((s) =>
      s.proposalId === proposalId && !s.locked
        ? { ...s, coachState: "accepted" as const, acceptedByDefault: true }
        : s
    ),
  };
}
