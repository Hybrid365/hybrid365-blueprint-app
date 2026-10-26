/**
 * Server helpers for Week Composer — load context + propose.
 * Apply returns draft data only; publish remains a separate coach action.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { getHyroxAthletePerformanceProfile } from "@/app/lib/hyroxAthleteBenchmarkServer";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { buildProgrammingAnchorsSummary } from "@/app/lib/hyroxProgrammingAnchors";
import { createWeekComposerInstruction } from "@/app/lib/hyroxWeekComposerInstruction";
import { proposeWeek } from "@/app/lib/hyroxWeekComposerPropose";
import { applyWeekProposalToDraft } from "@/app/lib/hyroxWeekComposerApply";
import type {
  WeekComposerContext,
  WeekComposerInstruction,
  WeekComposerMode,
  WeekComposerSessionSlot,
  WeekComposerWeekday,
  WeekProposal,
} from "@/app/lib/hyroxWeekComposerTypes";
import { loadWeeklyReviewForCoach } from "@/app/lib/hyroxWeeklyReviewServer";

function asWeekday(raw: string): WeekComposerWeekday {
  const map: Record<string, WeekComposerWeekday> = {
    Mon: "Mon",
    Monday: "Mon",
    Tue: "Tue",
    Tuesday: "Tue",
    Wed: "Wed",
    Wednesday: "Wed",
    Thu: "Thu",
    Thursday: "Thu",
    Fri: "Fri",
    Friday: "Fri",
    Sat: "Sat",
    Saturday: "Sat",
    Sun: "Sun",
    Sunday: "Sun",
  };
  return map[raw] ?? "Mon";
}

export async function loadWeekComposerContext(args: {
  supabase: SupabaseClient;
  athlete: HyroxAthleteRow;
  mode: WeekComposerMode;
  sourceWeekNumber: number;
  instruction?: WeekComposerInstruction;
}): Promise<{ context: WeekComposerContext; profile: HyroxAthletePerformanceProfile }> {
  const { supabase, athlete, mode, sourceWeekNumber } = args;
  const targetWeek = mode === "next_week" ? sourceWeekNumber + 1 : sourceWeekNumber;

  const review = await loadWeeklyReviewForCoach(supabase, athlete, sourceWeekNumber);
  const { profile } = await getHyroxAthletePerformanceProfile(supabase, athlete.id);
  const anchorsSummary = buildProgrammingAnchorsSummary(profile, { includeRun10k: true });

  const sessions: WeekComposerSessionSlot[] = (review.adaptation?.sessions ?? []).map((s) => ({
    sessionId: s.sessionId,
    draftId: null,
    day: asWeekday(s.dayOfWeek),
    dateYmd: null,
    slot: "am",
    title: s.sessionName,
    category: s.category,
    libraryEntryId: null,
    familyId: s.familyId,
    stageId: s.stageId,
    stageLabel: s.stageLabel,
    structureLine: s.stageLabel,
    targetPreview: null,
    status: s.status,
    completed: s.status === "complete" || s.status === "completed",
    isPast:
      s.status === "complete" ||
      s.status === "completed" ||
      s.status === "partial" ||
      s.status === "missed" ||
      s.status === "modified",
    isKeySession: s.isKeySession,
    plannedRunKm: null,
    plannedMinutes: s.plannedDurationMinutes,
    execution: s.execution,
    coachTargetOverride: false,
  }));

  const context: WeekComposerContext = {
    mode,
    athlete: {
      id: athlete.id,
      name: athlete.name ?? athlete.email ?? null,
      coachingProduct: "hyrox_1_1",
      blockNumber: athlete.current_block ?? null,
      blockWeek: athlete.current_week ?? null,
      globalWeek: sourceWeekNumber,
      targetWeek,
      raceName: athlete.race_name ?? null,
      raceDate: athlete.race_date ?? null,
      raceWeek: false,
    },
    anchors: anchorsSummary.items.map((item) => ({
      key: item.key,
      label: item.label,
      displayValue: item.primary,
      present: item.freshness !== "not_set" && Boolean(item.primary),
    })),
    sourceWeek: {
      weekNumber: sourceWeekNumber,
      weekStartYmd: null,
      weekEndYmd: null,
      published: review.summary.published,
      sessions,
    },
    recentWeeks: [],
    recommendations: review.adaptation?.recommendations ?? [],
    weekly: {
      plannedRunKm: review.adaptation?.summary.plannedRunMinutes
        ? Math.round((review.adaptation.summary.plannedRunMinutes / 6) * 10) / 10
        : null,
      actualRunKm: review.adaptation?.summary.actualRunKm ?? null,
      plannedSessions: review.adaptation?.summary.plannedSessions ?? sessions.length,
      qualityPlanned: review.adaptation?.summary.qualitySessionCompletion.planned ?? 0,
      painFlags: review.adaptation?.summary.painFlags ?? [],
      readinessNote: null,
    },
    instruction: args.instruction ?? createWeekComposerInstruction(""),
    decisionAuthority: "coach",
  };

  return { context, profile };
}

export function buildProposalFromContext(context: WeekComposerContext): WeekProposal {
  return proposeWeek(context);
}

/**
 * Pure apply wrapper — returns draft week. Caller persists via programme draft PATCH.
 * Never publishes.
 */
export function applyComposerProposalDraftOnly(args: {
  sourceDraft: CoachDraftWeek;
  proposal: WeekProposal;
  acceptedProposalIds?: string[];
  rejectedProposalIds?: string[];
  profile?: HyroxAthletePerformanceProfile | null;
}): {
  draftWeek: CoachDraftWeek;
  appliedProposalIds: string[];
  skippedProposalIds: string[];
  published: false;
  autoApplyForbidden: true;
  decisionAuthority: "coach";
} {
  const result = applyWeekProposalToDraft({
    sourceDraft: args.sourceDraft,
    request: {
      proposal: args.proposal,
      acceptedProposalIds: args.acceptedProposalIds,
      rejectedProposalIds: args.rejectedProposalIds,
    },
    profile: args.profile ?? null,
  });
  return {
    draftWeek: result.draftWeek,
    appliedProposalIds: result.appliedProposalIds,
    skippedProposalIds: result.skippedProposalIds,
    published: false,
    autoApplyForbidden: true,
    decisionAuthority: "coach",
  };
}
