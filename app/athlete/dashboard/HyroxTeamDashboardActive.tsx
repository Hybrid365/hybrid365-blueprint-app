"use client";

import Link from "next/link";
import {
  BarChart3,
  Battery,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Info,
  LayoutGrid,
  Lock,
  Moon,
  Play,
  Scale,
  Star,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_BENCHMARKS,
  MOCK_BODYWEIGHT,
  MOCK_CHECK_IN,
  MOCK_COACH_NOTES,
  MOCK_NEXT_SESSION,
  MOCK_PERFORMANCE_PROFILE,
  MOCK_PROGRESS_STATS,
  MOCK_RACE_PREP,
  MOCK_RESOURCES,
  MOCK_UPCOMING,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
} from "@/app/lib/hyroxTeamDashboardMock";
import { BodyweightSpark, sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { HyroxSessionRowCard } from "@/components/hyrox-team/HyroxSessionRowCard";
import { HyroxThisWeekTrackingCard } from "@/components/hyrox-team/HyroxThisWeekTrackingCard";

function priorityStyle(p: "Key" | "Supporting" | "Optional") {
  if (p === "Key") return "bg-yellow-400/25 text-yellow-300 border-yellow-400/40";
  return "bg-zinc-600/40 text-zinc-300 border-zinc-700/50";
}

export default function HyroxTeamDashboardActive() {
  const a = MOCK_ATHLETE;
  const next = MOCK_NEXT_SESSION;
  const stats = MOCK_PROGRESS_STATS;
  const completedCount = MOCK_WEEK_SESSIONS.filter((s) => s.status === "complete").length;
  const progressPercent = Math.min(100, Math.round((a.currentWeek / a.totalWeeks) * 100));
  const currentBlock = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Athlete overview hero */}
      <section className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 shadow-xl shadow-black/30 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(250,204,21,0.12),transparent)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
              {a.status}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{a.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {a.raceLocation} · {a.raceCategory} · Target {a.targetTime}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-200">
                {a.blockPhase} · Week {a.currentWeek} / {a.totalWeeks}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {stats.weeklyCompletionPct}% weekly completion
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
              <span className="font-semibold text-yellow-400/90">Coaching focus: </span>
              {a.coachingFocus}
            </p>
            <div className="mt-6 max-w-md">
              <div className="mb-2 flex justify-between text-sm font-medium text-zinc-400">
                <span>Weekly completion</span>
                <span className="text-yellow-400">{stats.weeklyCompletionPct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                  style={{ width: `${stats.weeklyCompletionPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[300px]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Timer className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-zinc-500">Race countdown</span>
              </div>
              <p className="text-2xl font-bold text-white">{a.raceCountdownWeeks} wks</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-zinc-500">Current week</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {a.currentWeek}
                <span className="text-lg text-zinc-500"> / {a.totalWeeks}</span>
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:col-span-1">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-zinc-500">Training phase</span>
              </div>
              <p className="text-lg font-bold leading-tight text-white">{a.blockPhase}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community-style two-column layout */}
      <div className="grid gap-10 lg:grid-cols-[1fr_min(380px,34%)] xl:grid-cols-[1fr_420px] xl:gap-12">
        {/* ——— Main column ——— */}
        <div className="min-w-0 space-y-10">
          <HyroxThisWeekTrackingCard />

          {/* Week hero — mirrors community */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 lg:p-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
              Block {a.blockId} · {currentBlock.name}
            </div>
            <h3 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Week {a.currentWeek}
              <span className="text-zinc-600"> of {a.totalWeeks}</span>
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">{a.weeklyFocus}</p>
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-400">
                <span>12-week block progress</span>
                <span className="text-yellow-400">{progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {[
                {
                  icon: Calendar,
                  label: "Sessions",
                  value: `${stats.sessionsCompleted}/${stats.sessionsPlanned}`,
                  sub: completedCount === stats.sessionsPlanned ? "Week complete" : "Logging live",
                },
                {
                  icon: TrendingUp,
                  label: "Weekly load",
                  value: stats.weeklyLoad,
                  sub: `${stats.trainingHours}h / ${stats.trainingHoursPlanned}h planned`,
                },
                {
                  icon: ClipboardCheck,
                  label: "Check-in",
                  value: MOCK_CHECK_IN.status,
                  sub: `Due ${MOCK_CHECK_IN.dueLabel}`,
                },
                {
                  icon: Target,
                  label: "Block",
                  value: currentBlock.name,
                  sub: `Block ${a.blockId} of 3`,
                },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700/60 sm:p-6"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/20">
                      <tile.icon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">{tile.label}</span>
                  </div>
                  <p className="text-xl font-bold leading-tight text-white sm:text-2xl">{tile.value}</p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">{tile.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Progress tracking — 8 stat cards */}
          <section>
            <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">Progress tracking</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {[
                { label: "Sessions done", value: `${stats.sessionsCompleted}/${stats.sessionsPlanned}`, sub: "This week" },
                { label: "Completion", value: `${stats.weeklyCompletionPct}%`, sub: "Weekly target 100%" },
                { label: "Block progress", value: `${stats.blockProgressPct}%`, sub: stats.blockLabel },
                { label: "Check-in streak", value: `${stats.checkInStreak} wks`, sub: "Keep it going" },
                { label: "Run volume", value: `${stats.weeklyRunKm} km`, sub: `Planned ${stats.weeklyRunKmPlanned} km` },
                { label: "Training hours", value: `${stats.trainingHours}h`, sub: `Planned ${stats.trainingHoursPlanned}h` },
                { label: "Avg session RPE", value: String(stats.avgSessionRpe), sub: "Logged sessions" },
                {
                  label: "Modified / missed",
                  value: `${stats.modifiedSessions} / ${stats.missedSessions}`,
                  sub: "Adjusted vs skipped",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-4 shadow-sm shadow-black/20 sm:p-5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{s.label}</p>
                  <p className="mt-1 text-xl font-bold text-white sm:text-2xl">{s.value}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* This week's focus */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-yellow-400/80" />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                {MOCK_WEEK_RATIONALE.weekRole}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{MOCK_WEEK_RATIONALE.whyMatters}</p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Prioritise</p>
              <ul className="m-0 space-y-1 p-0">
                {MOCK_WEEK_RATIONALE.prioritise.map((s) => (
                  <li key={s} className="flex list-none items-start gap-2 text-sm text-zinc-300">
                    <span className="mt-1 shrink-0 text-yellow-400">›</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Progression focus</p>
              <p className="mt-1 text-sm text-zinc-400">{MOCK_WEEK_RATIONALE.progressionFocus}</p>
              <p className="mt-3 text-xs italic text-zinc-500">Coach: {MOCK_WEEK_RATIONALE.coachNote}</p>
            </div>
          </section>

          {/* 4. This week's training */}
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-xl font-bold text-white sm:text-2xl">This week&apos;s training</h3>
              <span className="rounded-full border border-zinc-800 bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300">
                {completedCount}/{MOCK_WEEK_SESSIONS.length} complete
                {stats.modifiedSessions > 0 ? ` · ${stats.modifiedSessions} modified` : ""}
              </span>
            </div>
            <div className="space-y-4">
              {MOCK_WEEK_SESSIONS.map((session) => (
                <HyroxSessionRowCard key={session.id} session={session} />
              ))}
            </div>
          </section>

          {/* 8. Hyrox benchmarks */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-white sm:text-2xl">Hyrox benchmark tracker</h3>
              <Link href="/athlete/testing" className="text-xs font-semibold text-yellow-400 hover:text-yellow-300">
                Update tests →
              </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                    <th className="px-4 py-3 font-semibold sm:px-6">Test</th>
                    <th className="px-4 py-3 font-semibold">Baseline</th>
                    <th className="px-4 py-3 font-semibold">Latest</th>
                    <th className="px-4 py-3 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BENCHMARKS.map((row) => (
                    <tr key={row.test} className="border-b border-zinc-800/80 last:border-0">
                      <td className="px-4 py-3 font-medium text-white sm:px-6">{row.test}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.baseline}</td>
                      <td className="px-4 py-3 text-zinc-300">{row.latest}</td>
                      <td className={`px-4 py-3 font-medium ${row.positive ? "text-emerald-400" : "text-zinc-500"}`}>
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. Performance profile */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/20 ring-1 ring-yellow-400/25">
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Athlete performance profile</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <ProfileField label="Athlete type" value={MOCK_PERFORMANCE_PROFILE.athleteType} />
              <ProfileField label="Main limiter" value={MOCK_PERFORMANCE_PROFILE.mainLimiter} highlight />
              <ProfileField label="Secondary limiter" value={MOCK_PERFORMANCE_PROFILE.secondaryLimiter} />
              <ProfileField label="Weekly structure" value={MOCK_PERFORMANCE_PROFILE.weeklyStructure} />
              <div className="sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Strengths</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MOCK_PERFORMANCE_PROFILE.strengths.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Weaknesses</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MOCK_PERFORMANCE_PROFILE.weaknesses.map((w) => (
                    <span
                      key={w}
                      className="rounded-full border border-zinc-600 bg-zinc-800/80 px-2.5 py-0.5 text-xs text-zinc-300"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-yellow-500/20 bg-yellow-400/5 p-4">
                <p className="text-[10px] font-semibold uppercase text-yellow-400/80">First 4-week focus</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{MOCK_PERFORMANCE_PROFILE.firstBlockFocus}</p>
              </div>
            </div>
            <Link href="/athlete/assessment" className="mt-5 inline-flex text-sm font-semibold text-yellow-400 hover:text-yellow-300">
              View full assessment →
            </Link>
          </section>

          {/* 11. Race prep */}
          <section className={`rounded-2xl border p-6 sm:p-8 ${MOCK_RACE_PREP.locked ? "border-zinc-800 bg-zinc-950/50" : "border-yellow-500/20 bg-zinc-900/80"}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Race strategy & prep</h3>
              {MOCK_RACE_PREP.locked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                  <Lock className="h-3 w-3" />
                  Unlocks Week 8
                </span>
              ) : null}
            </div>
            <div className={`grid gap-4 sm:grid-cols-2 ${MOCK_RACE_PREP.locked ? "opacity-70" : ""}`}>
              <PrepItem label="Target run pace" value={MOCK_RACE_PREP.targetRunPace} />
              <PrepItem label="Station strategy" value={MOCK_RACE_PREP.stationStrategy} />
              <PrepItem label="Fuelling plan" value={MOCK_RACE_PREP.fuelling} />
              <PrepItem label="Taper plan" value={MOCK_RACE_PREP.taper} />
              <PrepItem label="Race-day checklist" value={MOCK_RACE_PREP.raceDayChecklist} className="sm:col-span-2" />
            </div>
          </section>
        </div>

        {/* ——— Sidebar ——— */}
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-6 lg:self-start">
          <Link
            href="/athlete/assessment"
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <LayoutGrid className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Athlete profile</p>
                <p className="text-xs text-zinc-500">Assessment & limiters</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
          </Link>

          <Link
            href="/athlete/testing"
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Baseline testing</p>
                <p className="text-xs text-zinc-500">Hyrox benchmarks & markers</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
          </Link>

          {/* 2. Next session — prominent */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">Next session</h3>
            <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
                    {next.day} · {next.dateLabel}
                  </span>
                  <h4 className="mt-2 text-2xl font-bold leading-tight text-white">{next.name}</h4>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyle(next.priority)}`}>
                  {next.priority}
                </span>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${sessionTypeStyle(next.type)}`}>
                {next.type}
              </span>
              <p className="mb-5 mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">{next.objective}</p>
              <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400/80" />
                  {next.duration}
                </span>
                <span>RPE {next.rpeTarget}</span>
              </div>
              <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Coach note</p>
                <p className="mt-1 text-sm text-zinc-400">{next.coachNote}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-yellow-400/25 transition hover:bg-yellow-300"
              >
                <Play className="h-5 w-5" />
                View session
              </button>
            </div>
          </div>

          {/* 3. Upcoming sessions */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-7">
            <h3 className="mb-4 text-lg font-bold text-white">Upcoming sessions</h3>
            <ul className="m-0 space-y-4 p-0">
              {MOCK_UPCOMING.map((s) => (
                <li key={s.id} className="list-none border-b border-zinc-800/80 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-yellow-400/90">{s.day}</p>
                      <p className="mt-0.5 font-semibold text-white">{s.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sessionTypeStyle(s.type)}`}>
                          {s.type}
                        </span>
                        <span className="text-xs text-zinc-500">{s.duration}</span>
                      </div>
                    </div>
                    <button type="button" className="shrink-0 text-xs font-semibold text-yellow-400 hover:text-yellow-300">
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 6. Weekly check-in — community detail */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Weekly check-in</h3>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                {MOCK_CHECK_IN.status}
              </span>
            </div>
            <p className="mb-2 text-sm text-zinc-500">Due {MOCK_CHECK_IN.dueLabel}</p>
            <p className="mb-5 text-sm leading-relaxed text-zinc-400">
              Sleep, energy, stress, soreness, pain/niggles, bodyweight, session completion, and next week availability.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Scale, label: "Bodyweight", value: MOCK_CHECK_IN.lastMetrics.bodyweight },
                { icon: Moon, label: "Sleep", value: MOCK_CHECK_IN.lastMetrics.sleep },
                { icon: Zap, label: "Energy", value: MOCK_CHECK_IN.lastMetrics.energy },
                { icon: Battery, label: "Recovery", value: MOCK_CHECK_IN.lastMetrics.recovery },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-zinc-400">
                    <m.icon className="h-4 w-4 text-yellow-400/80" />
                    <span className="text-xs font-medium uppercase tracking-wide">{m.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Last check-in summary</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {MOCK_CHECK_IN.lastSummary.note} · {MOCK_CHECK_IN.lastSummary.availability}
              </p>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-yellow-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
            >
              Complete weekly check-in
            </button>
          </div>

          {/* 7. Bodyweight */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Bodyweight trend</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Optional performance & body composition tracking — not a fat-loss focus. Use as a signal alongside
              fuelling and recovery.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Starting</p>
                <p className="mt-1 text-lg font-bold text-white">{MOCK_BODYWEIGHT.startKg} kg</p>
              </div>
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-400/5 p-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Current</p>
                <p className="mt-1 text-lg font-bold text-yellow-200">{MOCK_BODYWEIGHT.currentKg} kg</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Week Δ</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {MOCK_BODYWEIGHT.weeklyChangeKg > 0 ? "+" : ""}
                  {MOCK_BODYWEIGHT.weeklyChangeKg} kg
                </p>
              </div>
            </div>
            <BodyweightSpark series={MOCK_BODYWEIGHT.series} />
            <p className="mt-3 text-xs italic leading-relaxed text-zinc-500">{MOCK_BODYWEIGHT.coachNote}</p>
          </div>

          {/* 10. Coach notes — detailed cards */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Coach notes</h3>
            <div className="space-y-3">
              <CoachNoteCard label="Current focus" text={MOCK_COACH_NOTES.currentFocus} />
              <CoachNoteCard label="Recent adjustment" text={MOCK_COACH_NOTES.recentAdjustment} muted />
              <CoachNoteCard label="Next priority" text={MOCK_COACH_NOTES.nextPriority} muted />
              <CoachNoteCard label="Avoid this week" text={MOCK_COACH_NOTES.avoidThisWeek} warn />
            </div>
          </div>

          {/* 12. Resources */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Hyrox resources</h3>
            <div className="grid gap-3 sm:grid-cols-1">
              {MOCK_RESOURCES.map((r) => (
                <button
                  key={r.title}
                  type="button"
                  className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition hover:border-yellow-500/25 hover:bg-zinc-900"
                >
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400/80" />
                  <div>
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{r.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm ${highlight ? "font-medium text-yellow-200" : "text-zinc-300"}`}>{value}</p>
    </div>
  );
}

function PrepItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function CoachNoteCard({
  label,
  text,
  muted,
  warn,
}: {
  label: string;
  text: string;
  muted?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        warn ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase ${warn ? "text-red-300/80" : "text-zinc-500"}`}>{label}</p>
      <p className={`mt-1 text-sm leading-relaxed ${muted ? "text-zinc-400" : "text-zinc-300"}`}>{text}</p>
    </div>
  );
}
