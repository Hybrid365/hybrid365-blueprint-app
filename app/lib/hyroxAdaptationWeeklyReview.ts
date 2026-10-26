/**
 * Weekly Review adaptation slice — domain layer for coach Weekly Review / future Week Composer.
 * Recommend-only. Does not mutate programmes.
 */

import {
  recommendAdaptation,
  type AdaptationHistoryExposure,
  type AdaptationSessionContext,
} from "@/app/lib/hyroxAdaptationRecommend";
import type {
  AdaptationCoachDecision,
  AdaptationRecommendation,
} from "@/app/lib/hyroxAdaptationTypes";
import { isAdaptationVerb } from "@/app/lib/hyroxAdaptationTypes";
import { buildSessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionSummary";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";
import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import { isKeyProgrammeSession } from "@/app/lib/hyroxBlockReview";

export type WeeklyAdaptationSessionFact = {
  sessionId: string;
  sessionName: string;
  dayOfWeek: string;
  category: string;
  status: string;
  isKeySession: boolean;
  plannedDurationMinutes: number | null;
  actualRunKm: number | null;
  execution: SessionExecutionSummary | null;
  familyId: string | null;
  stageId: string | null;
  stageLabel: string | null;
  athleteNote: string | null;
};

export type WeeklyAdaptationSummary = {
  plannedSessions: number;
  completed: number;
  partial: number;
  missed: number;
  unresolved: number;
  plannedRunMinutes: number | null;
  actualRunKm: number | null;
  qualitySessionCompletion: {
    planned: number;
    completedOrPartial: number;
  };
  averageSessionRpe: number | null;
  painFlags: Array<{ sessionId: string; sessionName: string; pain: string }>;
  athleteNotes: Array<{ sessionId: string; sessionName: string; note: string }>;
  sessionsRequiringAttention: string[];
};

export type WeeklyAdaptationSlice = {
  summary: WeeklyAdaptationSummary;
  sessions: WeeklyAdaptationSessionFact[];
  recommendations: AdaptationRecommendation[];
  decisions: AdaptationCoachDecision[];
};

function extractFamily(prescription: unknown): {
  familyId: string | null;
  stageId: string | null;
  stageLabel: string | null;
} {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
    return { familyId: null, stageId: null, stageLabel: null };
  }
  const sf = (prescription as Record<string, unknown>).sessionFamily;
  if (!sf || typeof sf !== "object" || Array.isArray(sf)) {
    return { familyId: null, stageId: null, stageLabel: null };
  }
  const o = sf as Record<string, unknown>;
  return {
    familyId: typeof o.familyId === "string" ? o.familyId : null,
    stageId: typeof o.stageId === "string" ? o.stageId : null,
    stageLabel: typeof o.stageLabel === "string" ? o.stageLabel : null,
  };
}

function parseRunKmFromFeedback(feedback: HyroxJson | null | undefined): number | null {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return null;
  const metrics = (feedback as Record<string, unknown>).metrics;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  const raw = (metrics as Record<string, unknown>).distanceKm;
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function buildWeeklyAdaptationSessionFact(input: {
  id: string;
  session_name: string;
  day_of_week: string;
  category: string;
  session_slot: string;
  status: string;
  metadata: Record<string, unknown> | null;
  prescription: unknown;
  athlete_feedback: HyroxJson | null | undefined;
  plannedDurationMinutes: number | null;
}): WeeklyAdaptationSessionFact {
  const family = extractFamily(input.prescription);
  const execution = buildSessionExecutionSummary({
    status: input.status,
    athleteFeedback: input.athlete_feedback,
  });
  const isKey = isKeyProgrammeSession({
    metadata: input.metadata ?? {},
    sessionSlot: input.session_slot,
    category: input.category,
  });

  return {
    sessionId: input.id,
    sessionName: input.session_name,
    dayOfWeek: input.day_of_week,
    category: input.category,
    status: input.status,
    isKeySession: isKey,
    plannedDurationMinutes: input.plannedDurationMinutes,
    actualRunKm: parseRunKmFromFeedback(input.athlete_feedback),
    execution,
    familyId: family.familyId,
    stageId: family.stageId,
    stageLabel: family.stageLabel,
    athleteNote: execution?.athleteNote ?? null,
  };
}

export function summarizeWeeklyAdaptation(sessions: WeeklyAdaptationSessionFact[]): WeeklyAdaptationSummary {
  let completed = 0;
  let partial = 0;
  let missed = 0;
  let unresolved = 0;
  let plannedRunMinutes = 0;
  let hasPlannedRun = false;
  let actualRunKm = 0;
  let hasActualRun = false;
  let qualityPlanned = 0;
  let qualityDone = 0;
  const rpes: number[] = [];
  const painFlags: WeeklyAdaptationSummary["painFlags"] = [];
  const athleteNotes: WeeklyAdaptationSummary["athleteNotes"] = [];
  const sessionsRequiringAttention: string[] = [];

  for (const s of sessions) {
    const c = s.execution?.completion;
    if (c === "complete") completed += 1;
    else if (c === "partial") partial += 1;
    else if (c === "missed") missed += 1;
    else unresolved += 1;

    if (s.category.toLowerCase().includes("run") || /run/i.test(s.sessionName)) {
      if (s.plannedDurationMinutes != null) {
        plannedRunMinutes += s.plannedDurationMinutes;
        hasPlannedRun = true;
      }
      if (s.actualRunKm != null) {
        actualRunKm += s.actualRunKm;
        hasActualRun = true;
      }
    }

    if (s.isKeySession) {
      qualityPlanned += 1;
      if (c === "complete" || c === "partial") qualityDone += 1;
    }

    if (s.execution?.rpe != null) rpes.push(s.execution.rpe);
    if (s.execution?.pain === "meaningful" || s.execution?.pain === "minor") {
      painFlags.push({
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        pain: s.execution.pain,
      });
    }
    if (s.athleteNote?.trim()) {
      athleteNotes.push({
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        note: s.athleteNote.trim(),
      });
    }
    if (
      s.execution?.pain === "meaningful" ||
      s.execution?.completion === "partial" ||
      (s.isKeySession && !s.execution) ||
      s.execution?.missedReason === "pain_injury"
    ) {
      sessionsRequiringAttention.push(s.sessionId);
    }
  }

  const averageSessionRpe =
    rpes.length > 0 ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;

  return {
    plannedSessions: sessions.length,
    completed,
    partial,
    missed,
    unresolved,
    plannedRunMinutes: hasPlannedRun ? plannedRunMinutes : null,
    actualRunKm: hasActualRun ? Math.round(actualRunKm * 100) / 100 : null,
    qualitySessionCompletion: { planned: qualityPlanned, completedOrPartial: qualityDone },
    averageSessionRpe,
    painFlags,
    athleteNotes,
    sessionsRequiringAttention,
  };
}

export function buildWeeklyAdaptationRecommendations(
  sessions: WeeklyAdaptationSessionFact[]
): AdaptationRecommendation[] {
  const byFamily = new Map<string, WeeklyAdaptationSessionFact[]>();
  for (const s of sessions) {
    if (!s.familyId) continue;
    const list = byFamily.get(s.familyId) ?? [];
    list.push(s);
    byFamily.set(s.familyId, list);
  }

  const out: AdaptationRecommendation[] = [];
  for (const s of sessions) {
    if (!s.execution && s.status === "scheduled") continue;
    const history: AdaptationHistoryExposure[] = [];
    if (s.familyId) {
      const peers = (byFamily.get(s.familyId) ?? []).filter((p) => p.sessionId !== s.sessionId);
      for (const p of peers.slice(-3)) {
        history.push({
          sessionId: p.sessionId,
          familyId: p.familyId,
          stageId: p.stageId,
          execution: p.execution,
        });
      }
    }
    const ctx: AdaptationSessionContext = {
      sessionId: s.sessionId,
      sessionName: s.sessionName,
      category: s.category,
      isKeySession: s.isKeySession,
      familyId: s.familyId,
      stageId: s.stageId,
      stageLabel: s.stageLabel,
      execution: s.execution,
    };
    out.push(recommendAdaptation({ session: ctx, history }));
  }
  return out;
}

export function buildWeeklyAdaptationSlice(args: {
  sessions: WeeklyAdaptationSessionFact[];
  decisions?: AdaptationCoachDecision[];
}): WeeklyAdaptationSlice {
  const recommendations = buildWeeklyAdaptationRecommendations(args.sessions);
  const summary = summarizeWeeklyAdaptation(args.sessions);
  for (const rec of recommendations) {
    if (rec.escalateToCoach || rec.verb === "COACH_REVIEW") {
      if (!summary.sessionsRequiringAttention.includes(rec.sessionId)) {
        summary.sessionsRequiringAttention.push(rec.sessionId);
      }
    }
  }
  return {
    summary,
    sessions: args.sessions,
    recommendations,
    decisions: args.decisions ?? [],
  };
}

export function parseAdaptationDecisions(raw: unknown): AdaptationCoachDecision[] {
  if (!Array.isArray(raw)) return [];
  const out: AdaptationCoachDecision[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.sessionId !== "string") continue;
    if (!isAdaptationVerb(o.recommendedVerb) || !isAdaptationVerb(o.coachVerb)) continue;
    out.push({
      id: o.id,
      sessionId: o.sessionId,
      recommendedVerb: o.recommendedVerb,
      recommendedConfidence:
        o.recommendedConfidence === "high" || o.recommendedConfidence === "medium"
          ? o.recommendedConfidence
          : "low",
      recommendedReasons: Array.isArray(o.recommendedReasons)
        ? o.recommendedReasons.filter((r): r is string => typeof r === "string")
        : [],
      coachVerb: o.coachVerb,
      finalToStageId: typeof o.finalToStageId === "string" ? o.finalToStageId : null,
      finalToStageLabel: typeof o.finalToStageLabel === "string" ? o.finalToStageLabel : null,
      decidedAt: typeof o.decidedAt === "string" ? o.decidedAt : new Date().toISOString(),
      decidedByUserId: typeof o.decidedByUserId === "string" ? o.decidedByUserId : null,
      note: typeof o.note === "string" ? o.note : null,
      programmeModified: false,
    });
  }
  return out;
}
