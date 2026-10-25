/**
 * Progression apply helpers — empty draft shells, stage transitions, preview refresh.
 * Does not publish. Does not mutate athlete current_week (server ensure must respect that).
 */

import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type {
  CoachDraftDay,
  CoachDraftSession,
  CoachDraftWeek,
  WeekdayName,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  blockNumberForGlobalWeek,
  cycleInBlockForGlobalWeek,
} from "@/app/lib/hyroxProgrammeDates";
import { refreshFamilyLinkedDraftPreview } from "@/app/lib/hyroxSessionFamilyDraft";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type {
  SessionFamily,
  SessionFamilyStage,
  SessionFamilyTransition,
  SessionFamilyTransitionAction,
} from "@/app/lib/hyroxSessionFamilyTypes";
import {
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
} from "@/app/lib/hyroxSessionFamilyFormat";
import { structuredWorkoutToCoachEditConfig } from "@/app/lib/hyroxSessionFamilyBuilderAdapter";
import { createCoachDraftSessionFromFamilyStage } from "@/app/lib/hyroxSessionFamilyDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";

const WEEKDAYS: WeekdayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Empty draft week shell for progression apply into weeks that have no draft yet. */
export function buildEmptyCoachDraftWeekShell(args: {
  athleteId: string;
  globalWeek: number;
}): CoachDraftWeek {
  const block = blockNumberForGlobalWeek(args.globalWeek);
  const days: CoachDraftDay[] = WEEKDAYS.map((day) => ({
    day,
    role: "recovery",
    roleLabel: "Open",
    title: day,
    sessionType: "rest",
    intensity: "",
    duration: "",
    rpeHr: "",
    isKeySession: false,
    hardDay: false,
    hardEasyLabel: "Easy",
    thresholdMinutes: 0,
    qualityRunMinutes: 0,
    plannedMinutes: 0,
    rationale: "",
    sessions: [],
    optionalAddOn: null,
    emom: null,
    stationFocus: null,
    equipment: [],
    sessionId: null,
    prescription: null,
    sessionDetail: null,
  }));

  return {
    athleteId: args.athleteId,
    block,
    week: args.globalWeek,
    generatedAt: new Date().toISOString(),
    days,
  };
}

export function targetGlobalWeeksForProgression(args: {
  startGlobalWeek: number;
  blockLength: number;
}): number[] {
  const out: number[] = [];
  for (let i = 0; i < args.blockLength; i++) {
    out.push(args.startGlobalWeek + i);
  }
  return out;
}

export function describeStageStructure(stage: SessionFamilyStage): string {
  const block = stage.structuredWorkout.blocks.find((b) => b.type === "repeat");
  if (!block || block.type !== "repeat") return stage.label;
  return `${formatRepeatBlock(block)} · ${formatRecoveriesWithSuffix(block.recoveries)}`;
}

export type ManualStageOption = {
  action: SessionFamilyTransitionAction;
  toStageId: string;
  toStageKey: string;
  toStageLabel: string;
  structureLine: string;
};

/** Valid coach-facing transitions from the current stage (no auto suggestions). */
export function listManualStageOptions(
  family: SessionFamily,
  fromStageId: string
): ManualStageOption[] {
  const stageById = new Map(family.stages.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const options: ManualStageOption[] = [];

  const push = (t: SessionFamilyTransition) => {
    if (t.fromStageId !== fromStageId) return;
    const key = `${t.action}:${t.toStageId}`;
    if (seen.has(key)) return;
    seen.add(key);
    const to = stageById.get(t.toStageId);
    if (!to) return;
    options.push({
      action: t.action,
      toStageId: to.id,
      toStageKey: to.key,
      toStageLabel: to.label,
      structureLine: describeStageStructure(to),
    });
  };

  for (const t of family.transitions) push(t);

  // Always allow REPEAT of current if missing
  if (!seen.has(`REPEAT:${fromStageId}`)) {
    const cur = stageById.get(fromStageId);
    if (cur) {
      options.unshift({
        action: "REPEAT",
        toStageId: cur.id,
        toStageKey: cur.key,
        toStageLabel: cur.label,
        structureLine: describeStageStructure(cur),
      });
    }
  }

  const order: SessionFamilyTransitionAction[] = [
    "PROGRESS",
    "REPEAT",
    "REDUCE",
    "DELOAD",
    "SKIP_TO",
  ];
  return options.sort(
    (a, b) => order.indexOf(a.action) - order.indexOf(b.action) || a.toStageLabel.localeCompare(b.toStageLabel)
  );
}

/**
 * Replace a linked draft session's stage in-place (future drafts only).
 * Rebuilds editConfig + attachment from the new stage; preserves draftId/slot/day placement.
 */
export function applyManualStageChangeToSession(args: {
  session: CoachDraftSession;
  family: SessionFamily;
  nextStageId: string;
  profile: HyroxAthletePerformanceProfile;
  resolvedAt: string;
}): CoachDraftSession {
  const { session, family, nextStageId, profile, resolvedAt } = args;
  if (!session.sessionFamily) {
    throw new Error("Session is not family-linked.");
  }
  const stage = family.stages.find((s) => s.id === nextStageId);
  if (!stage) throw new Error(`Unknown stage ${nextStageId}`);

  const rebuilt = createCoachDraftSessionFromFamilyStage({
    family,
    stageId: nextStageId,
    profile,
    resolvedAt,
    draftId: session.draftId,
    base: {
      timeOfDay: session.timeOfDay,
      badges: session.badges,
      title: `${family.name} · ${stage.label}`,
      sessionType: session.sessionType,
      duration: session.duration,
      intensity: session.intensity,
      rpeHr: session.rpeHr,
      isKeySession: session.isKeySession,
      isOptional: session.isOptional,
      rationale: family.objective,
      sessionId: session.sessionId,
      prescription: null,
      sessionDetail: null,
    },
  });

  return {
    ...rebuilt,
    draftId: session.draftId,
    timeOfDay: session.timeOfDay,
    isKeySession: session.isKeySession,
    isOptional: session.isOptional,
    badges: session.badges,
  };
}

/** Re-resolve all family-linked sessions in a draft against the current profile. */
export function refreshFamilyLinkedDraftWeekPreviews(
  draft: CoachDraftWeek,
  profile: HyroxAthletePerformanceProfile,
  resolvedAt: string
): CoachDraftWeek {
  return {
    ...draft,
    days: draft.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => {
        if (!session.sessionFamily) return session;
        const family = getSessionFamily(session.sessionFamily.familyId);
        if (!family) return session;
        return refreshFamilyLinkedDraftPreview(session, family, profile, resolvedAt);
      }),
    })),
  };
}

export function familyContextLabel(session: CoachDraftSession): string | null {
  const att = session.sessionFamily;
  if (!att) return null;
  const short =
    att.stageKey.startsWith("stage_")
      ? `Stage ${att.stageKey.replace("stage_", "")}`
      : att.stageKey === "consolidation"
        ? "Consolidation"
        : att.stageKey.startsWith("deload")
          ? "Deload"
          : att.stageKey;
  const familyShort = att.familyName.replace(/^Threshold — /, "Threshold ");
  return `${familyShort} · ${short}`;
}

export function insertSessionOnWeekday(
  week: CoachDraftWeek,
  session: CoachDraftSession,
  day: WeekdayName,
  slot?: SandboxTimeOfDay
): CoachDraftWeek {
  const dayIndex = week.days.findIndex((d) => d.day === day);
  if (dayIndex < 0) return week;
  const placed =
    slot && session.timeOfDay !== slot ? { ...session, timeOfDay: slot } : session;
  return {
    ...week,
    days: week.days.map((d, i) =>
      i === dayIndex ? { ...d, sessions: [...d.sessions, placed] } : d
    ),
  };
}

export { cycleInBlockForGlobalWeek, blockNumberForGlobalWeek };

/** Project stage structure into editConfig (for Change Stage preview). */
export function previewEditConfigForStage(family: SessionFamily, stageId: string) {
  const stage = family.stages.find((s) => s.id === stageId);
  if (!stage) return null;
  return structuredWorkoutToCoachEditConfig(stage.structuredWorkout, {
    sessionName: stage.label,
    kind: "threshold_run",
    thresholdMinutes: stage.qualityVolume?.thresholdMinutes,
  });
}
