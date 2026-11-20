import { applyReflowFixture } from "@/app/lib/daily-readiness/applyFixture";
import type { DailyReadinessState, ReflowProposal, WeekDay, WeekSession } from "@/app/lib/daily-readiness/types";
import { assertNoLiveWrite } from "./flags";
import { fingerprint, TRACK_POLICY_VERSION } from "./policy";
import type { AdaptationRecord, CalendarSession, TrackAthleteRecord } from "./store";

const WEEK_DATE: Record<WeekDay, string> = {
  Mon: "2026-11-16",
  Tue: "2026-11-17",
  Wed: "2026-11-18",
  Thu: "2026-11-19",
  Fri: "2026-11-20",
  Sat: "2026-11-21",
  Sun: "2026-11-22",
};

function toCalendar(session: WeekSession, prior: CalendarSession | undefined, version: number): CalendarSession {
  return {
    ...session,
    date: prior?.date ?? WEEK_DATE[session.day],
    kind: prior?.kind ?? "training",
    testId: prior?.testId ?? null,
    instructions: prior?.instructions ?? [],
    version,
  };
}

export type ApplyResult = {
  applied: boolean;
  sessions: WeekSession[];
  record: AdaptationRecord;
  rolledBack: boolean;
};

function cloneSessions(sessions: CalendarSession[]): CalendarSession[] {
  return sessions.map((session) => ({ ...session, load: session.load.map((item) => ({ ...item })), instructions: [...session.instructions] }));
}

/**
 * Applies every operation or none.
 * This rehearses the write. It does not call a live database.
 */
export function rehearseAtomicApply(input: {
  record: TrackAthleteRecord;
  proposal: ReflowProposal;
  state: DailyReadinessState;
  decision: "accepted" | "declined";
  recordedAt: string;
  source?: AdaptationRecord["source"];
}): ApplyResult {
  const before = cloneSessions(input.record.sessions);
  const version = cloneSessions(input.record.sessions);
  const priorById = new Map(before.map((session) => [session.id, session]));
  try {
    const applied = applyReflowFixture({
      sessions: before,
      proposal: input.proposal,
      state: input.state,
      decision: input.decision,
      recordedAt: input.recordedAt,
    });
    const ids = applied.sessions.map((session) => session.id);
    if (new Set(ids).size !== ids.length) throw new Error("Duplicate session ids.");
    const completedBefore = new Set(before.filter((session) => session.status === "completed").map((session) => session.id));
    for (const id of completedBefore) {
      const after = applied.sessions.find((session) => session.id === id);
      const prior = before.find((session) => session.id === id);
      if (after && prior && (after.day !== prior.day || after.status !== "completed")) {
        throw new Error("Completed history moved.");
      }
    }
    const nextVersion = input.record.versions.length + 1;
    const afterSessions = applied.sessions.map((session) =>
      toCalendar(session, priorById.get(session.id), nextVersion)
    );
    const record: AdaptationRecord = {
      id: `adapt-${input.record.adaptations.length + 1}`,
      source: input.source ?? "daily_readiness",
      decision: input.decision,
      fingerprint: fingerprint(input.proposal.action, input.state.localDate, before),
      snapshot: input.state,
      proposal: input.proposal,
      beforeWeek: version,
      afterWeek: cloneSessions(afterSessions),
      recordedAt: input.recordedAt,
      policyVersion: TRACK_POLICY_VERSION,
    };
    input.record.versions.push(version);
    input.record.sessions = afterSessions;
    input.record.adaptations.push(record);
    return { applied: input.decision === "accepted" && input.proposal.status === "proposed", sessions: applied.sessions, record, rolledBack: false };
  } catch (error) {
    input.record.sessions = version;
    const record: AdaptationRecord = {
      id: `adapt-rollback-${input.record.adaptations.length + 1}`,
      source: input.source ?? "daily_readiness",
      decision: "blocked",
      fingerprint: fingerprint(input.proposal.action, input.state.localDate, version),
      snapshot: { error: error instanceof Error ? error.message : "apply failed" },
      proposal: input.proposal,
      beforeWeek: version,
      afterWeek: version,
      recordedAt: input.recordedAt,
      policyVersion: TRACK_POLICY_VERSION,
    };
    input.record.adaptations.push(record);
    return { applied: false, sessions: version, record, rolledBack: true };
  }
}

export function commitWouldBeRefused(): string {
  try {
    assertNoLiveWrite({ NODE_ENV: "development", VERCEL_ENV: "preview" });
  } catch (error) {
    return error instanceof Error ? error.message : "refused";
  }
  return "Track programme mutation is off. Nothing was written to a live athlete.";
}
