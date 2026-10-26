/**
 * Deterministic fixtures for Week Composer QA / visual review.
 * Not real athlete data.
 */

import type { AdaptationRecommendation } from "@/app/lib/hyroxAdaptationTypes";
import { recommendAdaptation } from "@/app/lib/hyroxAdaptationRecommend";
import {
  HYROX_COMPROMISED_RUN_FAMILY_ID,
  HYROX_COMPROMISED_RUN_STAGE_IDS,
} from "@/app/lib/families/hyroxCompromisedRun";
import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "@/app/lib/families/threshold5MinRepeats";
import type { SessionExecutionSummary } from "@/app/lib/hyroxSessionExecutionTypes";
import { createWeekComposerInstruction } from "@/app/lib/hyroxWeekComposerInstruction";
import type {
  WeekComposerContext,
  WeekComposerSessionSlot,
  WeekComposerWeekday,
} from "@/app/lib/hyroxWeekComposerTypes";
import {
  buildEmptyCoachDraftWeekShell,
} from "@/app/lib/hyroxSessionFamilyApply";
import { createCoachDraftSessionFromFamilyStage } from "@/app/lib/hyroxSessionFamilyDraft";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";

const completeControlled: SessionExecutionSummary = {
  completion: "complete",
  execution: "all",
  rpe: 6,
  control: "controlled",
  pain: "none",
  energy: null,
  legs: null,
  missedReason: null,
  athleteNote: null,
  actuals: null,
  source: "structured",
};

function slot(partial: Partial<WeekComposerSessionSlot> & Pick<WeekComposerSessionSlot, "sessionId" | "day" | "title">): WeekComposerSessionSlot {
  return {
    draftId: partial.draftId ?? `draft-${partial.sessionId}`,
    slot: partial.slot ?? "am",
    dateYmd: partial.dateYmd ?? null,
    category: partial.category ?? "run",
    libraryEntryId: partial.libraryEntryId ?? null,
    familyId: partial.familyId ?? null,
    stageId: partial.stageId ?? null,
    stageLabel: partial.stageLabel ?? null,
    structureLine: partial.structureLine ?? null,
    targetPreview: partial.targetPreview ?? null,
    status: partial.status ?? "scheduled",
    completed: partial.completed ?? false,
    isPast: partial.isPast ?? false,
    isKeySession: partial.isKeySession ?? false,
    plannedRunKm: partial.plannedRunKm ?? null,
    plannedMinutes: partial.plannedMinutes ?? null,
    execution: partial.execution ?? null,
    coachTargetOverride: partial.coachTargetOverride ?? false,
    ...partial,
  };
}

const STRUCTURE: Array<{
  day: WeekComposerWeekday;
  title: string;
  id: string;
  key?: boolean;
  family?: "threshold" | "hyrox";
  km?: number;
}> = [
  { day: "Mon", title: "Easy Run", id: "s-mon", km: 8 },
  {
    day: "Tue",
    title: "Threshold — 5 Minute Repeats",
    id: "s-tue",
    key: true,
    family: "threshold",
    km: 12,
  },
  { day: "Wed", title: "Easy + Strength", id: "s-wed", km: 6 },
  { day: "Thu", title: "HYROX Compromised", id: "s-thu", key: true, km: 10 },
  { day: "Fri", title: "Easy Run", id: "s-fri", km: 8 },
  {
    day: "Sat",
    title: "HYROX — Compromised Running",
    id: "s-sat",
    key: true,
    family: "hyrox",
    km: 8,
  },
  { day: "Sun", title: "Long Run", id: "s-sun", key: true, km: 16 },
];

export function buildFixtureComposerContext(opts?: {
  mode?: WeekComposerContext["mode"];
  raceWeek?: boolean;
  painOnTue?: boolean;
  missingThresholdAnchor?: boolean;
  coachOverridePace?: string | null;
  freeText?: string;
  progressTue?: boolean;
  reduceSat?: boolean;
  tueCompleted?: boolean;
}): WeekComposerContext {
  const mode = opts?.mode ?? "next_week";
  const sessions: WeekComposerSessionSlot[] = STRUCTURE.map((s) => {
    const isTue = s.id === "s-tue";
    const execution = isTue
      ? opts?.painOnTue
        ? { ...completeControlled, pain: "meaningful" as const }
        : completeControlled
      : s.key
        ? completeControlled
        : null;
    return slot({
      sessionId: s.id,
      day: s.day,
      title: s.title,
      isKeySession: Boolean(s.key),
      plannedRunKm: s.km ?? null,
      plannedMinutes: (s.km ?? 0) * 6,
      familyId:
        s.family === "threshold"
          ? THRESHOLD_5MIN_FAMILY_ID
          : s.family === "hyrox"
            ? HYROX_COMPROMISED_RUN_FAMILY_ID
            : null,
      stageId:
        s.family === "threshold"
          ? THRESHOLD_5MIN_STAGE_IDS.s2
          : s.family === "hyrox"
            ? HYROX_COMPROMISED_RUN_STAGE_IDS.s2
            : null,
      stageLabel:
        s.family === "threshold"
          ? "6 × 5 min · 2 min walk"
          : s.family === "hyrox"
            ? "5 × (station + 400m) · 2:30 recovery"
            : null,
      structureLine:
        s.family === "threshold"
          ? "6 × 5 min · 2 min walk"
          : s.family === "hyrox"
            ? "5 × (station + 400m)"
            : s.title,
      targetPreview:
        s.family === "threshold"
          ? opts?.coachOverridePace ?? (opts?.missingThresholdAnchor ? null : "3:55/km")
          : s.family === "hyrox"
            ? "HYROX run pace"
            : null,
      coachTargetOverride: Boolean(opts?.coachOverridePace) && s.family === "threshold",
      execution,
      completed: isTue ? Boolean(opts?.tueCompleted) : Boolean(execution),
      isPast: mode === "remaining_week" && isTue ? Boolean(opts?.tueCompleted) : false,
      status: execution ? "complete" : "scheduled",
      category: s.title.toLowerCase().includes("strength")
        ? "strength"
        : s.title.toLowerCase().includes("hyrox") || s.title.toLowerCase().includes("compromised")
          ? "hyrox"
          : "run",
    });
  });

  const tue = sessions.find((s) => s.sessionId === "s-tue")!;
  const recommendations: AdaptationRecommendation[] = [];
  if (tue.familyId && tue.stageId) {
    recommendations.push(
      recommendAdaptation({
        session: {
          sessionId: tue.sessionId,
          sessionName: tue.title,
          category: tue.category,
          isKeySession: true,
          familyId: tue.familyId,
          stageId: tue.stageId,
          stageLabel: tue.stageLabel,
          execution: tue.execution,
          policyContext: {
            raceWeek: opts?.raceWeek,
            missingAnchor: opts?.missingThresholdAnchor,
          },
        },
      })
    );
  }

  return {
    mode,
    athlete: {
      id: "fixture-athlete",
      name: "Fixture Athlete",
      coachingProduct: "hyrox_1_1",
      blockNumber: 2,
      blockWeek: 2,
      globalWeek: 6,
      targetWeek: mode === "next_week" ? 7 : 6,
      raceName: opts?.raceWeek ? "Race Day" : null,
      raceDate: opts?.raceWeek ? "2026-10-26" : null,
      raceWeek: Boolean(opts?.raceWeek),
    },
    anchors: [
      {
        key: "threshold",
        label: "Threshold pace",
        displayValue: opts?.missingThresholdAnchor ? null : "3:50/km",
        present: !opts?.missingThresholdAnchor,
      },
      {
        key: "run_5k",
        label: "5K",
        displayValue: "18:30",
        present: true,
      },
    ],
    sourceWeek: {
      weekNumber: 6,
      weekStartYmd: "2026-10-13",
      weekEndYmd: "2026-10-19",
      published: true,
      sessions,
    },
    recentWeeks: [],
    recommendations,
    weekly: {
      plannedRunKm: 68,
      actualRunKm: 64,
      plannedSessions: sessions.length,
      qualityPlanned: sessions.filter((s) => s.isKeySession).length,
      painFlags: opts?.painOnTue
        ? [{ sessionId: "s-tue", sessionName: tue.title, pain: "meaningful" }]
        : [],
      readinessNote: null,
    },
    instruction: createWeekComposerInstruction(opts?.freeText ?? "", {
      progressDays: opts?.progressTue ? ["Tue"] : [],
      reduceDays: opts?.reduceSat ? ["Sat"] : [],
      runVolumeKmMin: 65,
      runVolumeKmMax: 70,
      longRunMinutes: 90,
    }),
    decisionAuthority: "coach",
  };
}

export function buildFixtureSourceDraft(profile: HyroxAthletePerformanceProfile): CoachDraftWeek {
  const family = getSessionFamily(THRESHOLD_5MIN_FAMILY_ID)!;
  const shell = buildEmptyCoachDraftWeekShell({
    athleteId: "fixture-athlete",
    globalWeek: 6,
  });

  for (const s of STRUCTURE) {
    const day = shell.days.find((d) => d.day === s.day)!;
    if (s.family === "threshold") {
      day.sessions.push(
        createCoachDraftSessionFromFamilyStage({
          family,
          stageId: THRESHOLD_5MIN_STAGE_IDS.s2,
          profile,
          resolvedAt: "2026-10-13T12:00:00.000Z",
          draftId: `draft-${s.id}`,
          base: {
            timeOfDay: "AM",
            badges: [],
            title: s.title,
            sessionType: "tempo_aerobic_quality",
            duration: "60",
            intensity: "threshold",
            rpeHr: "7",
            isKeySession: true,
            isOptional: false,
            rationale: family.objective,
            sessionId: null,
            prescription: null,
            sessionDetail: null,
          },
        })
      );
    } else if (s.family === "hyrox") {
      const hyroxFamily = getSessionFamily(HYROX_COMPROMISED_RUN_FAMILY_ID)!;
      day.sessions.push(
        createCoachDraftSessionFromFamilyStage({
          family: hyroxFamily,
          stageId: HYROX_COMPROMISED_RUN_STAGE_IDS.s2,
          profile,
          resolvedAt: "2026-10-13T12:00:00.000Z",
          draftId: `draft-${s.id}`,
          base: {
            timeOfDay: "AM",
            badges: [],
            title: s.title,
            sessionType: "compromised_running",
            duration: "55",
            intensity: "compromised",
            rpeHr: "8",
            isKeySession: true,
            isOptional: false,
            rationale: hyroxFamily.objective,
            sessionId: null,
            prescription: null,
            sessionDetail: null,
          },
        })
      );
    } else {
      day.sessions.push({
        timeOfDay: "AM",
        badges: [],
        title: s.title,
        sessionType: "run_development",
        duration: "45",
        intensity: "easy",
        rpeHr: "4",
        isKeySession: Boolean(s.key),
        isOptional: false,
        rationale: "",
        sessionId: null,
        prescription: null,
        sessionDetail: null,
        draftId: `draft-${s.id}`,
        coachNote: "",
        editConfig: {
          kind: "easy_aerobic",
          sessionName: s.title,
          durationMinutes: 45,
        },
      });
    }
  }
  return shell;
}

export function fixturePerformanceProfile(): HyroxAthletePerformanceProfile {
  return {
    run5k: null,
    run10k: null,
    run30min: null,
    threshold: {
      benchmarkId: "b-th",
      paceSecondsPerKm: 230,
      thresholdHr: null,
      resultDate: "2026-10-01",
      source: "coach_entered",
    },
    hyroxRun: null,
    ski2k: null,
    ski1k: null,
    row2k: null,
    ftp: null,
    hyroxRace: null,
    readiness: [],
  };
}
