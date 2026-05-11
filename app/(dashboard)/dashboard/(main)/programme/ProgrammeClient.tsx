"use client";

import { useMemo, useState } from "react";
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
import { Nav } from "@/components/nav";
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

export type WeekPayload = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

type SessionLogRecord = {
  id: string;
  week_number: number;
  session_key: string;
  session_title: string | null;
  session_day: string | null;
  completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
};

type Props = {
  programmeInstanceId: string | null;
  programmeTitle: string;
  programmeGenerated: boolean;
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
};

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/programme", label: "Programme" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/habits", label: "Habits" },
  { href: "/dashboard/challenge", label: "Challenge" },
  { href: "/dashboard/assessment", label: "Assessment" },
  { href: "/dashboard/testing", label: "Testing" },
];

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
}: Props) {
  const [selectedWeek, setSelectedWeek] = useState(defaultSelectedWeek);
  const [drawerSession, setDrawerSession] = useState<SessionWithKey | null>(null);
  const [shareCard, setShareCard] = useState<SessionShareCardProps | null>(null);

  const logByKey = useMemo(
    () => Object.fromEntries(initialSessionLogs.map((l) => [l.session_key, l])),
    [initialSessionLogs]
  );

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

  const sessions = useMemo(() => {
    if (!unlocked || !weekRow?.plan_json) return [];
    return normalizeProgrammeScheduleForWeek(selectedWeek, weekRow.plan_json);
  }, [unlocked, weekRow?.plan_json, selectedWeek]);

  const currentBlock = PROGRAMME_BLOCKS.find((b) => b.id === blockIdForWeek(selectedWeek))!;

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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Nav />
      <main className="flex-1 pb-24 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8 md:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Hybrid365</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Your 12-Week Programme</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
            A structured progression built around your goal, availability and current performance.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  item.href === "/dashboard/programme"
                    ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700/60 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {!programmeInstanceId || !programmeGenerated ? (
          <div className="mx-auto mt-10 max-w-6xl px-4 md:px-8">
            <div className="rounded-2xl border border-yellow-400/25 bg-gradient-to-br from-yellow-400/[0.07] to-zinc-900/90 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <LayoutGrid className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">Generate your programme first</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                Your full 12-week journey appears here once your plan is created from the dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                >
                  Go to dashboard
                  <ChevronRight className="h-4 w-4" />
                </Link>
                {!assessmentCompleted ? (
                  <Link
                    href="/dashboard/assessment"
                    className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
                  >
                    Complete assessment
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-6xl space-y-10 px-4 pb-20 md:px-8">
            {/* A — Hero */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-zinc-400">{programmeTitle}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Current week</p>
                  <p className="text-3xl font-bold text-white">Week {effectiveWeek}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {unlockedCount} week{unlockedCount === 1 ? "" : "s"} unlocked this period
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Block</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {currentBlock.id} · {currentBlock.title}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Unlocked</p>
                    <p className="mt-1 text-sm font-bold text-white">{unlockedCount} / 12</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 sm:col-span-1 col-span-2">
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Session completion</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {totalUnlockedSlots > 0
                        ? `${completedUnlocked}/${totalUnlockedSlots} (${completionPercentage}%)`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* B — Roadmap */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Calendar className="h-5 w-5 text-yellow-400" />
                12-week roadmap
              </h2>
              <div className="space-y-8">
                {PROGRAMME_BLOCKS.map((block) => (
                  <div key={block.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">
                          Block {block.id}
                        </p>
                        <h3 className="text-lg font-bold text-white">{block.title}</h3>
                        <p className="text-sm text-zinc-500">{block.subtitle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {block.weeks.map((wn) => {
                        const w = weeksFromDb.find((x) => x.week_number === wn);
                        const isUnlocked = Boolean(w?.is_unlocked);
                        const isSel = selectedWeek === wn;
                        const stats = completedByWeek[wn];
                        const done = stats?.completed ?? 0;
                        const tot = stats?.total ?? 0;
                        const wf = w?.plan_json ? extractWeekOverviewFromPlan(w.plan_json).weekFocus : null;
                        return (
                          <button
                            key={wn}
                            type="button"
                            onClick={() => setSelectedWeek(wn)}
                            className={`rounded-xl border px-3 py-3 text-left transition ${
                              isSel
                                ? "border-yellow-400/50 bg-yellow-400/10 ring-1 ring-yellow-400/20"
                                : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                            } ${!isUnlocked ? "opacity-55" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white">Week {wn}</span>
                              {!isUnlocked ? (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                              ) : isSel ? (
                                <Play className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                              ) : null}
                            </div>
                            {isUnlocked ? (
                              <>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                                  {wf ?? w?.title ?? "—"}
                                </p>
                                {tot > 0 ? (
                                  <p className="mt-2 text-[10px] font-medium text-zinc-500">
                                    {done}/{tot} sessions
                                  </p>
                                ) : (
                                  <p className="mt-2 text-[10px] text-zinc-600">No schedule</p>
                                )}
                              </>
                            ) : (
                              <p className="mt-2 text-[10px] text-zinc-600">Locked</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* C–E — Selected week */}
            <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-8">
              {!unlocked ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950">
                    <Lock className="h-7 w-7 text-zinc-500" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">Week {selectedWeek} is locked</h3>
                  <p className="mt-2 max-w-md text-sm text-zinc-400">
                    Unlocks with your next membership month. Session details stay hidden until this week opens.
                  </p>
                </div>
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
                        href="/dashboard"
                        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                      >
                        Log check-in on dashboard →
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
                      <p className="mt-4 text-xs italic text-zinc-500">Coach: {weekRationale.coach_note}</p>
                    </div>
                  ) : null}

                  <div className="mt-8">
                    <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                      <Dumbbell className="h-4 w-4 text-yellow-400" />
                      Sessions
                    </h4>
                    {sessions.length === 0 ? (
                      <p className="text-sm text-zinc-500">No schedule for this week.</p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session) => {
                          const log = logByKey[session.sessionKey];
                          const done = Boolean(log?.completed);
                          return (
                            <button
                              key={session.sessionKey}
                              type="button"
                              onClick={() => setDrawerSession(session)}
                              className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-left transition hover:border-zinc-700 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold uppercase text-zinc-500">
                                    {session.day}
                                  </span>
                                  {session.doubleSession ? (
                                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                      Double session
                                    </span>
                                  ) : null}
                                  {done ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Done
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 font-semibold text-white">{session.title}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{session.intent}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityStyle(session.priorityRank)}`}
                                  >
                                    {session.priorityDisplayLabel}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryStyle(session.category)}`}
                                  >
                                    {session.category}
                                  </span>
                                  {session.tags.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-3 text-sm text-zinc-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-yellow-400/70" />
                                  {session.duration}
                                </span>
                                <ChevronRight className="h-5 w-5 text-zinc-600" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* F — Programme rationale */}
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
          </div>
        )}

        {drawerSession ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setDrawerSession(null)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-600" />
              <div className="mx-auto max-w-3xl p-5 pb-12 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">{drawerSession.day}</p>
                    <p className="text-sm text-zinc-400">
                      {drawerSession.priorityDisplayLabel} — {drawerSession.priorityCategoryLabel}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{drawerSession.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{drawerSession.intent}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerSession(null)}
                    className="rounded-xl border border-zinc-800 bg-zinc-800 p-2 text-zinc-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                      <Timer className="h-4 w-4" />
                      Duration
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{drawerSession.duration}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                      <Clock className="h-4 w-4" />
                      Time cap
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{drawerSession.timeCap || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                      <Gauge className="h-4 w-4" />
                      RPE guide
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{drawerSession.rpeGuide}</p>
                  </div>
                </div>

                {(
                  [
                    ["Warm-up", drawerSession.warmUp],
                    ["Main work", drawerSession.mainWork],
                    ["Cool-down", drawerSession.coolDown],
                    ["Finish", drawerSession.finisher],
                  ] as const
                ).map(([label, lines]) =>
                  Array.isArray(lines) && lines.length > 0 ? (
                    <div key={label} className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                      <p className="text-sm font-bold text-white">{label}</p>
                      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                        {lines.map((line) => (
                          <li key={line}>
                            <span className="text-yellow-400">·</span> {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}

                {drawerSession.coachingNotes ? (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <p className="text-sm font-bold text-white">Coaching notes</p>
                    <p className="mt-2 text-sm text-zinc-300">{drawerSession.coachingNotes}</p>
                  </div>
                ) : null}

                {drawerSession.doubleSession ? (
                  <div className="mt-5 rounded-xl border border-blue-500/25 bg-blue-950/20 p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300">
                        {drawerSession.doubleSession.label}
                      </span>
                      <span className="font-semibold text-white">{drawerSession.doubleSession.title}</span>
                    </div>
                    <p className="text-sm text-zinc-400">{drawerSession.doubleSession.intent}</p>
                    {drawerSession.doubleSession.main.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                        {drawerSession.doubleSession.main.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="text-blue-400">·</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                  <p className="text-sm font-bold text-white">Completion & logging</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {logByKey[drawerSession.sessionKey]?.completed
                      ? "This session is marked complete."
                      : "Mark sessions complete from the main dashboard to update your progress."}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setShareCard(
                          shareCardInputFromMemberSession(drawerSession, logByKey[drawerSession.sessionKey])
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-4 py-2.5 text-sm font-semibold text-yellow-200 transition hover:border-yellow-400/55 hover:bg-yellow-400/15"
                    >
                      <Share2 className="h-4 w-4 shrink-0" />
                      View Share Card
                    </button>
                    <Link
                      href="/dashboard"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
                    >
                      Open dashboard
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      {shareCard ? (
        <SessionShareCardModal open onClose={() => setShareCard(null)} card={shareCard} />
      ) : null}
    </div>
  );
}
