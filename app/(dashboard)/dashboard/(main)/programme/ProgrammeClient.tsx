"use client";

import { useMemo, useState } from "react";
import type { CommunityProgrammeGateDebug } from "@/app/lib/communityProgrammeStatus";
import { CommunityProgrammeDevPanel } from "@/components/dashboard/CommunityProgrammeDevPanel";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Gauge,
  LayoutGrid,
  Lock,
  Play,
  Share2,
  Star,
  Target,
  Timer,
  X,
} from "lucide-react";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import { MemberSessionDetailDrawer } from "@/components/dashboard/MemberSessionDetailDrawer";
import { useMemberSessionLogs } from "@/app/lib/memberSessionLog";
import { findTodayOrNextSession } from "@/app/lib/memberNextSession";
import { resolveSessionDisplayState } from "@/app/lib/sessionLogTypes";
import type { MemberSessionLogRecord } from "@/app/lib/sessionLogTypes";
import { SessionStateBadge } from "@/components/dashboard/SessionStateBadge";
import {
  extractWeekRationale,
  type ExtractedProgrammeIntelligence,
  type ExtractedProgrammeRationale,
  type SessionCategoryLabel,
} from "@/app/lib/memberDashboardSchedule";
import {
  extractWeekOverviewFromPlan,
  getSelectedProgrammeWeek,
  normalizeProgrammeScheduleForWeek,
  PROGRAMME_BLOCKS,
  type SessionWithKey,
} from "@/app/lib/programmePageMetrics";
import { shareCardInputFromMemberSession } from "@/app/lib/sessionShareCardText";
import type { SessionShareCardProps } from "@/components/share/SessionShareCard";
import { SessionShareCardModal } from "@/components/share/SessionShareCardModal";
import { DashboardSupportCard } from "@/components/dashboard/DashboardSupportCard";
import { ProgrammeRefreshStaleNote } from "@/components/dashboard/ProgrammeRefreshStaleNote";
import { MissedSessionGuidanceNote } from "@/components/dashboard/MissedSessionGuidanceNote";
import {
  LockedWeekMessage,
  ProgrammeBlockUnlockNote,
} from "@/components/dashboard/ProgrammeBlockUnlockNote";
import { ProgrammeBeingBuiltCard } from "@/components/dashboard/ProgrammeBeingBuiltCard";
import { HyroxProgrammeContextCard } from "@/components/dashboard/hyrox/HyroxProgrammeContextCard";
import { WeekOneGuidanceCard } from "@/components/dashboard/WeekOneGuidanceCard";
import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import { emptyHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import {
  COMMUNITY_BUILD_PROGRAMME,
  COMMUNITY_COMPLETE_ATHLETE_PROFILE,
  COMMUNITY_PROGRAMME_PAGE_PENDING,
  COMMUNITY_PROGRAMME_PAGE_READY,
} from "@/components/dashboard/communityOnboardingCopy";

export type WeekPayload = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

type SessionLogRecord = MemberSessionLogRecord;

type Props = {
  programmeInstanceId: string | null;
  programmeTitle: string;
  programmeGenerated: boolean;
  /** Server-resolved view gate (matches dashboard home). */
  canViewProgramme: boolean;
  programmePendingUnlock: boolean;
  unlockAtMs: number | null;
  gateDebug?: CommunityProgrammeGateDebug;
  assessmentCompleted: boolean;
  effectiveWeek: number;
  defaultSelectedWeek: number;
  unlockedCount: number;
  completionPercentage: number;
  completedUnlocked: number;
  totalUnlockedSlots: number;
  completedByWeek: Record<number, { completed: number; total: number }>;
  weeksFromDb: WeekPayload[];
  initialSessionLogs: SessionLogRecord[];
  checkInsByWeek: Record<number, boolean>;
  programmeRationale: ExtractedProgrammeRationale | null;
  programmeIntelligence: ExtractedProgrammeIntelligence | null;
  maxHeartRate: number | null;
  hasEngineBenchmark: boolean;
  assessmentChangedSinceProgramme: boolean;
  isHyroxTrack?: boolean;
  hyroxDetails?: CommunityHyroxDetails;
};

function blockIdForWeek(week: number): 1 | 2 | 3 {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
}

function priorityStyle(rank: 1 | 2 | 3): string {
  if (rank === 1) return "bg-yellow-400/25 text-yellow-300 border-yellow-400/40";
  if (rank === 2) return "bg-zinc-600/40 text-zinc-300 border-zinc-800/50";
  return "bg-zinc-700/50 text-zinc-400 border-zinc-800/60";
}

function categoryStyle(cat: SessionCategoryLabel): string {
  const styles: Record<SessionCategoryLabel, string> = {
    Run: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    Strength: "bg-red-500/20 text-red-300 border-red-500/40",
    Hybrid: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    Aerobic: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    Recovery: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };
  return styles[cat] || "bg-zinc-500/20 text-zinc-300 border-zinc-800/50";
}

export default function ProgrammeClient({
  programmeInstanceId,
  programmeTitle,
  programmeGenerated,
  canViewProgramme,
  programmePendingUnlock,
  unlockAtMs,
  gateDebug,
  assessmentCompleted,
  effectiveWeek,
  defaultSelectedWeek,
  unlockedCount,
  completionPercentage,
  completedUnlocked,
  totalUnlockedSlots,
  completedByWeek,
  weeksFromDb,
  initialSessionLogs,
  checkInsByWeek,
  programmeRationale,
  programmeIntelligence,
  maxHeartRate,
  hasEngineBenchmark,
  assessmentChangedSinceProgramme,
  isHyroxTrack = false,
  hyroxDetails,
}: Props) {
  const [selectedWeek, setSelectedWeek] = useState(defaultSelectedWeek);
  const [shareCard, setShareCard] = useState<SessionShareCardProps | null>(null);

  const {
    sessionLogs,
    drawerOpen,
    selectedSession,
    selectedLog,
    draft,
    updateDraft,
    saving,
    saveError,
    openSessionDrawer,
    closeSessionDrawer,
    saveSessionLog,
  } = useMemberSessionLogs(programmeInstanceId, initialSessionLogs);

  const todaySessionKey = useMemo(() => {
    if (selectedWeek !== effectiveWeek) return null;
    const result = findTodayOrNextSession({
      weeks: weeksFromDb,
      sessionLogs,
      effectiveWeek,
    });
    return result.isTodayMatch ? result.session?.sessionKey ?? null : null;
  }, [weeksFromDb, sessionLogs, effectiveWeek, selectedWeek]);

  const selectedPayload = getSelectedProgrammeWeek(
    weeksFromDb.map((w) => ({
      week_number: w.week_number,
      is_unlocked: w.is_unlocked,
      plan_json: w.plan_json,
    })),
    selectedWeek
  );

  const weekRow = weeksFromDb.find((w) => w.week_number === selectedWeek) ?? null;
  const unlocked = Boolean(selectedPayload?.is_unlocked);
  const weekOverview = weekRow?.plan_json ? extractWeekOverviewFromPlan(weekRow.plan_json) : null;
  const weekRationale = weekRow?.plan_json ? extractWeekRationale(weekRow.plan_json) : null;

  const scheduleOptions = useMemo(
    () => ({ maxHeartRate, hasEngineBenchmark }),
    [maxHeartRate, hasEngineBenchmark]
  );

  const sessions = useMemo(() => {
    if (!unlocked || !weekRow?.plan_json) return [];
    return normalizeProgrammeScheduleForWeek(selectedWeek, weekRow.plan_json, scheduleOptions);
  }, [unlocked, weekRow?.plan_json, selectedWeek, scheduleOptions]);

  const currentWeekRow = weeksFromDb.find((w) => w.week_number === effectiveWeek) ?? null;
  const currentWeekUnlocked = Boolean(currentWeekRow?.is_unlocked);
  const currentWeekSessions = useMemo(() => {
    if (!currentWeekUnlocked || !currentWeekRow?.plan_json) return [];
    return normalizeProgrammeScheduleForWeek(effectiveWeek, currentWeekRow.plan_json, scheduleOptions);
  }, [currentWeekUnlocked, currentWeekRow?.plan_json, effectiveWeek, scheduleOptions]);

  const currentBlock = PROGRAMME_BLOCKS.find((b) => b.id === blockIdForWeek(selectedWeek))!;
  const effectiveBlock = PROGRAMME_BLOCKS.find((b) => b.id === blockIdForWeek(effectiveWeek))!;

  function renderSessionButtons(sessionList: SessionWithKey[]) {
    if (sessionList.length === 0) {
      return <p className="text-sm text-zinc-500">No schedule for this week.</p>;
    }
    return (
      <div className="space-y-3">
        {sessionList.map((session) => {
          const log = sessionLogs[session.sessionKey];
          const displayState = resolveSessionDisplayState({
            log,
            isTodaySession: todaySessionKey === session.sessionKey,
          });
          const hasLog = Boolean(log);
          return (
            <button
              key={session.sessionKey}
              type="button"
              onClick={() => openSessionDrawer(session)}
              className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-left transition hover:border-yellow-500/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-zinc-500">{session.day}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryStyle(session.category)}`}
                  >
                    {session.category}
                  </span>
                  <SessionStateBadge state={displayState} />
                </div>
                <p className="mt-1 font-semibold text-white">{session.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{session.intent}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-yellow-400/70" />
                  {session.duration}
                  {session.timeCap ? ` · ${session.timeCap}` : ""}
                </span>
                <span className="rounded-lg bg-yellow-400/15 px-2 py-1 text-xs font-bold text-yellow-300">
                  {hasLog ? "Edit log" : "Log result"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const intelChips = programmeIntelligence
    ? (() => {
        const k = programmeIntelligence;
        const limShort: Record<string, string> = {
          running_endurance: "Engine",
          running_speed: "Speed",
          strength: "Strength",
          hyrox_stations: "Stations",
          body_composition: "Body comp",
          recovery: "Low impact",
          consistency: "Consistency",
          general: "Balanced",
        };
        const goalShort =
          k.primary_goal === "hybrid" ? "Hybrid" : k.primary_goal === "running" ? "Running" : "Strength";
        const chips: string[] = [`${goalShort}`, limShort[k.limiter_focus] ?? "Balanced"];
        if (k.event_mode === "event" && !["none", "other"].includes(k.event_specificity)) {
          const ev: Record<string, string> = {
            hyrox_pro: "Hyrox Pro",
            hyrox_open: "Hyrox Open",
            hyrox_doubles: "Doubles",
            running_race: "Running race",
            triathlon: "Triathlon",
          };
          const evLabel = ev[k.event_specificity];
          if (evLabel) chips.push(evLabel);
        }
        return chips.slice(0, 4);
      })()
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="pb-8 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8 md:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Hybrid365</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Your 12-Week Programme</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
            A structured progression built around your goal, availability and current performance.
          </p>

          <div className="mt-4">
            <DashboardSubnav variant="zinc" />
          </div>

          {gateDebug ? <CommunityProgrammeDevPanel debug={gateDebug} /> : null}

          {programmeGenerated && assessmentChangedSinceProgramme ? (
            <div className="mx-auto mt-6 max-w-6xl px-4 md:px-8">
              <ProgrammeRefreshStaleNote />
            </div>
          ) : null}
        </div>

        {!canViewProgramme ? (
          <div className="mx-auto mt-10 max-w-6xl px-4 md:px-8">
            {programmePendingUnlock && programmeGenerated ? (
              <ProgrammeBeingBuiltCard unlockAtMs={unlockAtMs} />
            ) : (
            <div className="rounded-2xl border border-yellow-400/25 bg-gradient-to-br from-yellow-400/[0.07] to-zinc-900/90 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <LayoutGrid className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">
                {assessmentCompleted ? COMMUNITY_PROGRAMME_PAGE_READY : COMMUNITY_PROGRAMME_PAGE_PENDING}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                {assessmentCompleted
                  ? "Head to your dashboard to build your 12-week plan. Once it’s ready, your full schedule lives here — week by week, session by session."
                  : "Complete your Athlete Profile first so Hybrid365 can build your training around your goal, level, schedule, equipment and current fitness."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!assessmentCompleted ? (
                  <Link
                    href="/dashboard/assessment"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                  >
                    {COMMUNITY_COMPLETE_ATHLETE_PROFILE}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                  >
                    {COMMUNITY_BUILD_PROGRAMME}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href="/dashboard/testing"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
                >
                  Log benchmarks (optional)
                </Link>
              </div>
            </div>
            )}
            <DashboardSupportCard className="mt-6" />
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-6xl space-y-8 px-4 pb-20 md:px-8">
            {/* Compact header */}
            <section className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500">{programmeTitle}</p>
                  <p className="text-lg font-bold text-white">
                    Week {effectiveWeek} · {effectiveBlock.title}
                  </p>
                </div>
                <p className="text-sm text-zinc-400">
                  {unlockedCount}/12 unlocked · {completionPercentage}% complete
                </p>
              </div>
            </section>

            {isHyroxTrack ? (
              <HyroxProgrammeContextCard details={hyroxDetails ?? emptyHyroxDetails()} />
            ) : null}

            <ProgrammeBlockUnlockNote unlockedCount={unlockedCount} />

            {/* Week selector — compact */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Select week
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {weeksFromDb.map((w) => {
                  const week = w.week_number;
                  const isUnlocked = Boolean(w.is_unlocked);
                  const isSel = week === selectedWeek;
                  const isCurrent = week === effectiveWeek;
                  return (
                    <button
                      key={week}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && setSelectedWeek(week)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        isSel
                          ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-200"
                          : isUnlocked
                            ? "border-zinc-800 bg-zinc-900 text-zinc-300"
                            : "cursor-not-allowed border-zinc-800/60 bg-zinc-950/40 text-zinc-600"
                      }`}
                    >
                      {isUnlocked ? `W${week}` : <Lock className="mx-auto h-4 w-4" />}
                      {isCurrent && isUnlocked ? (
                        <span className="ml-1 text-[10px] text-yellow-400/80">· now</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* This week's sessions — priority */}
            <section className="rounded-2xl border border-yellow-500/25 bg-gradient-to-b from-yellow-400/[0.06] to-zinc-900/80 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Dumbbell className="h-5 w-5 text-yellow-400" />
                  This week&apos;s sessions
                </h2>
                <div className="text-right">
                  <span className="text-sm text-zinc-400">Week {effectiveWeek}</span>
                  {completedByWeek[effectiveWeek]?.total ? (
                    <p className="mt-0.5 text-xs font-semibold text-yellow-300/90">
                      {completedByWeek[effectiveWeek]!.completed}/
                      {completedByWeek[effectiveWeek]!.total} complete
                      {completedByWeek[effectiveWeek]!.total > 0
                        ? ` · ${Math.round(
                            (completedByWeek[effectiveWeek]!.completed /
                              completedByWeek[effectiveWeek]!.total) *
                              100
                          )}%`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              {!currentWeekUnlocked ? (
                <LockedWeekMessage />
              ) : (
                renderSessionButtons(currentWeekSessions)
              )}
              {checkInsByWeek[effectiveWeek] ? (
                <p className="mt-4 text-xs text-emerald-300">✓ Weekly check-in logged</p>
              ) : (
                <Link
                  href="/dashboard/check-in"
                  className="mt-4 inline-block text-sm font-semibold text-yellow-400 hover:text-yellow-300"
                >
                  Complete weekly check-in →
                </Link>
              )}
            </section>

            {/* Selected week (when different from current) */}
            {selectedWeek !== effectiveWeek ? (
              <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 sm:p-6">
                <h3 className="text-base font-bold text-white">Week {selectedWeek} sessions</h3>
                {!unlocked ? <LockedWeekMessage /> : renderSessionButtons(sessions)}
              </section>
            ) : null}

            {effectiveWeek === 1 ? <WeekOneGuidanceCard /> : null}

            {/* Selected week detail */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              {!unlocked ? (
                <LockedWeekMessage />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">
                        Week {selectedWeek}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-white">
                        {weekRow?.title?.trim() || `Week ${selectedWeek}`}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        {weekOverview?.blockFocusLabel ?? `Block ${blockIdForWeek(selectedWeek)} focus`}
                        {weekOverview?.weekFocus ? (
                          <>
                            {" "}
                            · <span className="text-zinc-300">{weekOverview.weekFocus}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    {checkInsByWeek[selectedWeek] ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Check-in logged
                      </span>
                    ) : (
                      <Link
                        href="/dashboard/check-in"
                        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                      >
                        Complete weekly check-in →
                      </Link>
                    )}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Weekly load", value: weekOverview?.weeklyLoadDisplay ?? "—" },
                      {
                        label: "Est. hours",
                        value:
                          weekOverview?.estimatedHours != null
                            ? `${weekOverview.estimatedHours.toFixed(1)} h`
                            : "—",
                      },
                      {
                        label: "Hard sessions",
                        value: weekOverview?.hardSessions != null ? String(weekOverview.hardSessions) : "—",
                      },
                      {
                        label: "Safety",
                        value: weekOverview?.safetyLevel ?? "none",
                        sub:
                          weekOverview?.safetyNotes?.length
                            ? weekOverview.safetyNotes.join(" ")
                            : undefined,
                      },
                    ].map((cell) => (
                      <div key={cell.label} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          {cell.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-white">{cell.value}</p>
                        {"sub" in cell && cell.sub ? (
                          <p className="mt-1 text-xs text-zinc-500">{cell.sub}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {weekRationale ? (
                    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-yellow-400" />
                        <h4 className="font-bold text-white">This week&apos;s focus</h4>
                      </div>
                      <p className="text-sm font-semibold text-yellow-200/90">{weekRationale.week_role}</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{weekRationale.why_this_week_matters}</p>
                      {weekRationale.key_sessions_to_prioritise.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {weekRationale.key_sessions_to_prioritise.map((s) => (
                            <li key={s} className="flex gap-2 text-sm text-zinc-400">
                              <span className="text-yellow-500">·</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {weekRationale.progression_focus ? (
                        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                              This week&apos;s progression
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                              {weekRationale.progression_focus}
                            </p>
                          </div>
                          {weekRationale.key_marker_this_week ? (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                Key marker
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">{weekRationale.key_marker_this_week}</p>
                            </div>
                          ) : null}
                          {weekRationale.what_progressed_from_last_week ? (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                vs last week
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {weekRationale.what_progressed_from_last_week}
                              </p>
                            </div>
                          ) : null}
                          <p className="text-xs italic text-zinc-500">Coach: {weekRationale.coach_note}</p>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs italic text-zinc-500">Coach: {weekRationale.coach_note}</p>
                      )}
                    </div>
                  ) : null}

                  {selectedWeek === effectiveWeek ? (
                    <div className="mt-6">
                      <MissedSessionGuidanceNote />
                    </div>
                  ) : null}
                </>
              )}
            </section>

            {/* Compact roadmap */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
                <Calendar className="h-4 w-4 text-yellow-400" />
                12-week roadmap
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {PROGRAMME_BLOCKS.map((block) => (
                  <div key={block.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-yellow-400/80">Block {block.id}</p>
                    <p className="text-sm font-bold text-white">{block.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {block.weeks.map((wn) => {
                        const w = weeksFromDb.find((x) => x.week_number === wn);
                        const isUnlocked = Boolean(w?.is_unlocked);
                        return (
                          <button
                            key={wn}
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => isUnlocked && setSelectedWeek(wn)}
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              selectedWeek === wn
                                ? "bg-yellow-400/20 text-yellow-200"
                                : isUnlocked
                                  ? "text-zinc-400"
                                  : "text-zinc-600"
                            }`}
                          >
                            {isUnlocked ? wn : <Lock className="inline h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Programme rationale */}
            {programmeRationale ? (
              <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-lg font-bold text-white">Why this programme</h2>
                </div>
                {intelChips.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {intelChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-zinc-700/90 bg-zinc-950/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="text-xl font-bold text-white">{programmeRationale.headline}</p>
                <ul className="mt-4 space-y-2">
                  {programmeRationale.summary.slice(0, 4).map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-zinc-300">
                      <span className="text-yellow-400">·</span>
                      {s}
                    </li>
                  ))}
                </ul>
                {programmeRationale.key_priorities.length > 0 ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Key priorities</p>
                    <ul className="space-y-1.5">
                      {programmeRationale.key_priorities.slice(0, 5).map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400/80" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            <DashboardSupportCard />
          </div>
        )}

        <MemberSessionDetailDrawer
          open={drawerOpen}
          session={selectedSession}
          onClose={closeSessionDrawer}
          log={selectedLog}
          draft={draft}
          updateDraft={updateDraft}
          saving={saving}
          saveError={saveError}
          programmeInstanceId={programmeInstanceId}
          isHyroxTrack={isHyroxTrack}
          onSave={() => saveSessionLog()}
          onShare={
            selectedSession
              ? () =>
                  setShareCard(
                    shareCardInputFromMemberSession(selectedSession, sessionLogs[selectedSession.sessionKey])
                  )
              : undefined
          }
        />
      </main>
      {shareCard ? (
        <SessionShareCardModal open onClose={() => setShareCard(null)} card={shareCard} />
      ) : null}
    </div>
  );
}
