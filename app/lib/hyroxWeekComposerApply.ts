/**
 * Apply Week Composer proposals into a CoachDraftWeek.
 * Draft only — never publishes. Never mutates completed published history.
 */

import type { CoachDraftSession, CoachDraftWeek, WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { cloneCoachDraftWeekForTarget } from "@/app/lib/hyroxCopyProgrammeWeek";
import { applyManualStageChangeToSession } from "@/app/lib/hyroxSessionFamilyApply";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type {
  ProposedComposerSession,
  WeekComposerApplyRequest,
  WeekComposerApplyResult,
  WeekProposal,
} from "@/app/lib/hyroxWeekComposerTypes";

function shouldApply(
  session: ProposedComposerSession,
  accepted?: string[],
  rejected?: string[]
): boolean {
  if (session.locked) return false;
  if (rejected?.includes(session.proposalId)) return false;
  if (accepted && accepted.length > 0) return accepted.includes(session.proposalId);
  return session.coachState === "accepted" || session.acceptedByDefault;
}

function titlesMatch(sessionTitle: string, proposedTitle: string): boolean {
  const a = sessionTitle.trim().toLowerCase();
  const b = proposedTitle.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function findSessionOnDay(
  draft: CoachDraftWeek,
  day: WeekdayName,
  sourceDraftId: string | null | undefined,
  title: string,
  familyId?: string | null,
  fromStageId?: string | null
): { dayIdx: number; sessionIdx: number; session: CoachDraftSession } | null {
  const scanDay = (di: number) => {
    const d = draft.days[di];
    for (let si = 0; si < d.sessions.length; si++) {
      const s = d.sessions[si];
      if (sourceDraftId && s.draftId === sourceDraftId) {
        return { dayIdx: di, sessionIdx: si, session: s };
      }
      if (
        familyId &&
        fromStageId &&
        s.sessionFamily?.familyId === familyId &&
        s.sessionFamily?.stageId === fromStageId
      ) {
        return { dayIdx: di, sessionIdx: si, session: s };
      }
      if (titlesMatch(s.title, title)) {
        return { dayIdx: di, sessionIdx: si, session: s };
      }
    }
    return null;
  };

  for (let di = 0; di < draft.days.length; di++) {
    if (draft.days[di].day !== day) continue;
    const hit = scanDay(di);
    if (hit) return hit;
  }
  // Fallback: search all days (MOVE / copy-rewritten draftIds)
  for (let di = 0; di < draft.days.length; di++) {
    const hit = scanDay(di);
    if (hit) return hit;
  }
  return null;
}

function applyOne(
  draft: CoachDraftWeek,
  proposed: ProposedComposerSession,
  profile: HyroxAthletePerformanceProfile | null,
  sourceDraftIdBySessionId: Map<string, string>
): boolean {
  if (proposed.action === "KEEP" && proposed.coachState !== "rejected") {
    // KEEP with same day — no mutation needed after clone
    return true;
  }

  const mappedId = proposed.sourceSessionId
    ? sourceDraftIdBySessionId.get(proposed.sourceSessionId)
    : undefined;
  const sourceDraftId =
    mappedId ??
    (proposed.sourceSessionId ? `draft-${proposed.sourceSessionId}` : null) ??
    proposed.sourceSessionId ??
    null;

  // Locate on original day from source (before MOVE)
  const originalDay = (proposed.difference.kind === "moved"
    ? (proposed.difference.before as WeekdayName)
    : proposed.day) as WeekdayName;

  const found = findSessionOnDay(
    draft,
    originalDay,
    sourceDraftId,
    proposed.title,
    proposed.familyId,
    proposed.fromStageId
  );
  if (!found) return false;

  if (proposed.action === "REMOVE") {
    draft.days[found.dayIdx].sessions.splice(found.sessionIdx, 1);
    return true;
  }

  let session = found.session;

  if (
    (proposed.action === "PROGRESS" ||
      proposed.action === "REDUCE" ||
      proposed.action === "REPEAT") &&
    proposed.familyId &&
    proposed.toStageId &&
    session.sessionFamily &&
    profile
  ) {
    const family = getSessionFamily(proposed.familyId);
    if (family && proposed.toStageId !== session.sessionFamily.stageId) {
      session = applyManualStageChangeToSession({
        session,
        family,
        nextStageId: proposed.toStageId,
        profile,
        resolvedAt: new Date().toISOString(),
      });
    }
  }

  if (proposed.action === "MOVE" && proposed.day !== originalDay) {
    draft.days[found.dayIdx].sessions.splice(found.sessionIdx, 1);
    const targetDay = draft.days.find((d) => d.day === proposed.day);
    if (!targetDay) return false;
    targetDay.sessions.push(session);
    return true;
  }

  draft.days[found.dayIdx].sessions[found.sessionIdx] = session;
  return true;
}

/**
 * Apply accepted proposals onto a cloned source draft for the target week.
 * Returns draft with published: false semantics (caller persists draft only).
 */
export function applyWeekProposalToDraft(args: {
  sourceDraft: CoachDraftWeek;
  request: WeekComposerApplyRequest;
  profile?: HyroxAthletePerformanceProfile | null;
  sourceDraftIdBySessionId?: Map<string, string>;
}): WeekComposerApplyResult {
  const { sourceDraft, request, profile = null } = args;
  const proposal = request.proposal;
  const draft = cloneCoachDraftWeekForTarget(sourceDraft, {
    athleteId: proposal.athleteId,
    targetWeek: proposal.targetWeekNumber,
  });

  const idMap = args.sourceDraftIdBySessionId ?? new Map<string, string>();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const session of proposal.sessions) {
    if (!shouldApply(session, request.acceptedProposalIds, request.rejectedProposalIds)) {
      skipped.push(session.proposalId);
      continue;
    }
    const ok = applyOne(draft, session, profile, idMap);
    if (ok) applied.push(session.proposalId);
    else skipped.push(session.proposalId);
  }

  return {
    ok: true,
    draftWeek: draft,
    appliedProposalIds: applied,
    skippedProposalIds: skipped,
    published: false,
    autoApplyForbidden: true,
  };
}

/** Filter proposal to only sessions the coach wants applied (selective). */
export function selectProposalSessions(
  proposal: WeekProposal,
  acceptedProposalIds: string[]
): WeekProposal {
  return {
    ...proposal,
    sessions: proposal.sessions.map((s) => ({
      ...s,
      coachState: acceptedProposalIds.includes(s.proposalId)
        ? ("accepted" as const)
        : s.locked
          ? s.coachState
          : ("rejected" as const),
      acceptedByDefault: acceptedProposalIds.includes(s.proposalId),
    })),
  };
}
