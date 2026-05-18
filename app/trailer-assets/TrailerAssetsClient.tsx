"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Target,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  TRAILER_5K_PROGRESSION,
  TRAILER_BENCHMARKS,
  TRAILER_CHECK_IN,
  TRAILER_COACH_ADJUSTMENTS,
  TRAILER_COMMUNITY,
  TRAILER_COMPROMISED_SESSION,
  TRAILER_HYROX_TEAM,
  TRAILER_ONE_TO_ONE,
  TRAILER_REEL_HEADLINES,
  TRAILER_THRESHOLD_PACE,
  TRAILER_VOLUME_BLOCKS,
  TRAILER_WEEK_DAYS,
} from "@/app/lib/trailerAssetsMock";
import { DashCard, ProgressBar, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";
import { RunVolumeChart, ThresholdPaceChart } from "./TrailerCharts";
import { TrailerSection } from "./TrailerSection";
import TrailerTeamLaunchPack from "./TrailerTeamLaunchPack";

const SECTION_NAV = [
  { id: "hyrox-hero", label: "1. Hyrox Hero" },
  { id: "weekly-programme", label: "2. Week" },
  { id: "run-volume", label: "3. Run Volume" },
  { id: "5k-progression", label: "4. 5km" },
  { id: "threshold-pace", label: "5. Threshold" },
  { id: "benchmarks", label: "6. Benchmarks" },
  { id: "volume-blocks", label: "7. Blocks" },
  { id: "session-detail", label: "8. Session" },
  { id: "check-in", label: "9. Check-in" },
  { id: "coach-adjust", label: "10. Coach" },
  { id: "one-to-one", label: "11. 1-1" },
  { id: "community", label: "12. Community" },
  { id: "reel-cards", label: "13. Reels" },
  { id: "team-launch-pack", label: "Team Launch" },
];

function statusIcon(status: "complete" | "upcoming") {
  if (status === "complete") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-zinc-600" />;
}

type Props = {
  userEmail: string;
};

export default function TrailerAssetsClient({ userEmail }: Props) {
  const h = TRAILER_HYROX_TEAM;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Page shell — internal mock only */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4D23C]">
              Hybrid365 Internal
            </p>
            <h1 className="text-lg font-bold text-white sm:text-xl">Trailer Asset Studio</h1>
            <p className="text-xs text-zinc-500">
              Mock UI for Hyrox365 Team trailer · {userEmail}
            </p>
          </div>
          <nav className="flex max-w-xl flex-wrap gap-1.5">
            {SECTION_NAV.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-[#F4D23C]/40 hover:text-[#F4D23C]"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <p className="mx-auto max-w-7xl px-5 pt-6 text-center text-xs text-zinc-600 sm:px-8">
        Screenshot each section individually · Desktop, 4:5 and 9:16 crops supported · No live user data
      </p>

      {/* ─── Section 1: Hyrox Team Dashboard Hero ─── */}
      <TrailerSection
        id="hyrox-hero"
        number={1}
        title="Hyrox Team Dashboard Hero"
        description="Primary hero frame for team athlete dashboard."
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#F4D23C]/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 shadow-xl shadow-black/40 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(244,210,60,0.12),transparent)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F4D23C]">
                Hyrox Team
              </span>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{h.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">Programme · {h.programme}</p>
              <p className="mt-1 text-sm text-zinc-500">{h.raceLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-300">
                  {h.currentBlock}
                </span>
                <span className="rounded-full border border-[#F4D23C]/25 bg-[#F4D23C]/10 px-3 py-1 text-xs font-medium text-[#F4D23C]">
                  {h.blockWeek}
                </span>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-300">
                <span className="font-semibold text-[#F4D23C]">Coach focus: </span>
                {h.coachFocus}
              </p>
              <div className="mt-6 max-w-md">
                <ProgressBar pct={h.weeklyCompletionPct} label="Weekly completion" />
              </div>
            </div>
            <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[320px]">
              <StatTile
                label="Race countdown"
                value={`${h.raceCountdownWeeks} wks`}
                icon={<Timer className="h-4 w-4 text-[#F4D23C]" />}
              />
              <StatTile
                label="Race target"
                value={h.raceTarget}
                icon={<Target className="h-4 w-4 text-[#F4D23C]" />}
              />
              <DashCard className="col-span-2 !p-4 sm:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Next key session
                </p>
                <p className="mt-1 text-sm font-bold text-white">{h.nextSession.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {h.nextSession.day} · {h.nextSession.duration} · RPE {h.nextSession.rpe}
                </p>
              </DashCard>
            </div>
          </div>
        </div>
      </TrailerSection>

      {/* ─── Section 2: Weekly Programme Preview ─── */}
      <TrailerSection
        id="weekly-programme"
        number={2}
        title="Weekly Programme Preview"
        description="Seven-day schedule with session cards — screenshot-ready grid."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TRAILER_WEEK_DAYS.map((d) => (
            <DashCard
              key={d.day}
              highlight={d.title.includes("Compromised") || d.title.includes("Threshold")}
              className="!p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#F4D23C]">
                    {d.short}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">{d.title}</p>
                </div>
                {statusIcon(d.status)}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {d.duration}
                </span>
                <span>RPE {d.rpe}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">{d.note}</p>
            </DashCard>
          ))}
        </div>
      </TrailerSection>

      {/* ─── Section 3: Run Progress Graph ─── */}
      <TrailerSection
        id="run-volume"
        number={3}
        title="Run Progress Graph"
        description="12-week volume progression with deload markers at weeks 4 and 8."
      >
        <DashCard highlight className="!p-6 sm:!p-8">
          <SectionHeading title="Weekly running volume" />
          <p className="mb-6 text-sm text-zinc-500">
            Progression 24km → 42km · Deload weeks 4 & 8
          </p>
          <RunVolumeChart />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F4D23C]" /> Volume
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-6 rounded bg-[#F4D23C]/10" /> Deload
            </span>
          </div>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 4: 5km Progression Graph ─── */}
      <TrailerSection
        id="5k-progression"
        number={4}
        title="5km Progression"
        description="Performance dashboard card — benchmark improvement over 12 weeks."
      >
        <DashCard highlight className="!p-6 sm:!p-8">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#F4D23C]" />
            <SectionHeading title="5km benchmark progression" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {TRAILER_5K_PROGRESSION.map((p) => (
              <div
                key={p.label}
                className={`rounded-xl border p-4 ${
                  p.kind === "target"
                    ? "border-[#F4D23C]/40 bg-[#F4D23C]/10"
                    : "border-zinc-800 bg-zinc-950/60"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {p.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold tabular-nums ${
                    p.kind === "target" ? "text-[#F4D23C]" : "text-white"
                  }`}
                >
                  {p.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden h-1 overflow-hidden rounded-full bg-zinc-800 sm:block">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-zinc-600 to-[#F4D23C]" />
          </div>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 5: Threshold Pace Progression ─── */}
      <TrailerSection
        id="threshold-pace"
        number={5}
        title="Threshold Pace Progression"
      >
        <DashCard className="!p-6 sm:!p-8">
          <SectionHeading title="Threshold pace" />
          <ThresholdPaceChart />
          <p className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-400">
            {TRAILER_THRESHOLD_PACE.coachNote}
          </p>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 6: Benchmark Tracking ─── */}
      <TrailerSection
        id="benchmarks"
        number={6}
        title="Benchmark Tracking"
        description="Previous · current · target for each test."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRAILER_BENCHMARKS.map((b) => (
            <DashCard key={b.name} className="!p-4">
              <p className="text-sm font-bold text-white">{b.name}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-zinc-600">Previous</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-400">{b.previous}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#F4D23C]">Current</p>
                  <p className="mt-1 text-sm font-bold text-[#F4D23C]">{b.current}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-zinc-600">Target</p>
                  <p className="mt-1 text-sm font-semibold text-white">{b.target}</p>
                </div>
              </div>
            </DashCard>
          ))}
        </div>
      </TrailerSection>

      {/* ─── Section 7: Volume Progression Card ─── */}
      <TrailerSection id="volume-blocks" number={7} title="Volume Progression — 4 Blocks">
        <div className="grid gap-4 lg:grid-cols-2">
          {TRAILER_VOLUME_BLOCKS.map((block) => (
            <DashCard key={block.name} className="!p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#F4D23C]">
                {block.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{block.subtitle}</p>
              <div className="mt-5 space-y-3">
                {(
                  [
                    ["Run volume", block.metrics.runVolume],
                    ["Erg volume", block.metrics.ergVolume],
                    ["Strength endurance", block.metrics.strengthEndurance],
                    ["Hyrox specificity", block.metrics.hyroxSpecificity],
                    ["Recovery management", block.metrics.recoveryManagement],
                  ] as const
                ).map(([label, pct]) => (
                  <ProgressBar key={label} pct={pct} label={label} />
                ))}
              </div>
            </DashCard>
          ))}
        </div>
      </TrailerSection>

      {/* ─── Section 8: Session Breakdown Preview ─── */}
      <TrailerSection id="session-detail" number={8} title="Session Breakdown Preview">
        <DashCard highlight className="!p-6 sm:!p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[#F4D23C]">Key session</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{TRAILER_COMPROMISED_SESSION.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            <span className="font-semibold text-white">Objective: </span>
            {TRAILER_COMPROMISED_SESSION.objective}
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Warm-up</p>
              <ul className="space-y-1.5 text-sm text-zinc-400">
                {TRAILER_COMPROMISED_SESSION.warmUp.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#F4D23C]">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Main work</p>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                {TRAILER_COMPROMISED_SESSION.mainWork.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#F4D23C]">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div>
              <p className="text-[10px] uppercase text-zinc-600">Target pace</p>
              <p className="text-sm font-semibold text-white">
                {TRAILER_COMPROMISED_SESSION.targetPace}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-600">RPE</p>
              <p className="text-sm font-semibold text-[#F4D23C]">
                {TRAILER_COMPROMISED_SESSION.rpe}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Coaching notes</p>
              <ul className="space-y-2 text-sm text-zinc-400">
                {TRAILER_COMPROMISED_SESSION.coachingNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Scaling options</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                {TRAILER_COMPROMISED_SESSION.scaling.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 9: Weekly Check-In Preview ─── */}
      <TrailerSection id="check-in" number={9} title="Weekly Check-In Preview">
        <DashCard highlight className="!p-6 sm:!p-8">
          <SectionHeading title="Weekly check-in" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Sleep", TRAILER_CHECK_IN.sleep],
                ["Energy", TRAILER_CHECK_IN.energy],
                ["Soreness", TRAILER_CHECK_IN.soreness],
                ["Bodyweight", TRAILER_CHECK_IN.bodyweight],
                ["Sessions completed", TRAILER_CHECK_IN.sessionsCompleted],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
                <p className="mt-1 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Athlete notes</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {TRAILER_CHECK_IN.athleteNotes}
            </p>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {TRAILER_CHECK_IN.coachStatus}
          </p>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 10: Coach Adjustment Card ─── */}
      <TrailerSection id="coach-adjust" number={10} title="Coach Adjustment">
        <DashCard className="max-w-xl !p-6 sm:!p-8">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#F4D23C]" />
            <h3 className="text-lg font-bold text-white">Coach Adjustment</h3>
          </div>
          <p className="text-sm text-zinc-400">Based on this week&apos;s check-in:</p>
          <ul className="mt-4 space-y-3">
            {TRAILER_COACH_ADJUSTMENTS.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F4D23C]" />
                {item}
              </li>
            ))}
          </ul>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 11: 1-1 Coaching Dashboard Preview ─── */}
      <TrailerSection
        id="one-to-one"
        number={11}
        title="1-1 Coaching Dashboard Preview"
        description="Personalised athlete view — more individual detail than team dashboard."
      >
        <DashCard highlight className="!p-6 sm:!p-8">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase text-violet-300">
            1-1 Coaching
          </span>
          <h3 className="mt-3 text-2xl font-bold text-white">{TRAILER_ONE_TO_ONE.name}</h3>
          <p className="mt-1 text-sm text-zinc-400">{TRAILER_ONE_TO_ONE.programme}</p>
          <p className="mt-1 text-sm font-medium text-[#F4D23C]">{TRAILER_ONE_TO_ONE.raceTarget}</p>
          <p className="mt-4 text-xs text-zinc-500">{TRAILER_ONE_TO_ONE.weekLabel}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {TRAILER_ONE_TO_ONE.benchmarks.map((b) => (
              <div
                key={b.label}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-center"
              >
                <p className="text-[10px] uppercase text-zinc-500">{b.label}</p>
                <p className="mt-1 text-xl font-bold text-white">{b.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Check-in</p>
              <p className="mt-1 text-sm text-emerald-300">{TRAILER_ONE_TO_ONE.checkInStatus}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Programme adjustments</p>
              <p className="mt-1 text-sm text-zinc-300">{TRAILER_ONE_TO_ONE.adjustmentNotes}</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-[#F4D23C]/20 bg-[#F4D23C]/5 p-4 text-sm leading-relaxed text-zinc-300">
            <span className="font-semibold text-[#F4D23C]">Coach feedback: </span>
            {TRAILER_ONE_TO_ONE.coachFeedback}
          </p>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 12: Community Programme Dashboard ─── */}
      <TrailerSection
        id="community"
        number={12}
        title="Community Programme Dashboard Preview"
        description="Broader member experience — challenges, leaderboard, education."
      >
        <DashCard className="!p-6 sm:!p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#F4D23C]">
                Hybrid365 Community
              </span>
              <h3 className="mt-1 text-2xl font-bold text-white">{TRAILER_COMMUNITY.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">Active · {TRAILER_COMMUNITY.activeProgramme}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
              <Users className="h-3.5 w-3.5" /> Community member
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRAILER_COMMUNITY.programmeOptions.map((opt) => (
              <span
                key={opt}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  opt === TRAILER_COMMUNITY.activeProgramme
                    ? "border-[#F4D23C]/40 bg-[#F4D23C]/10 text-[#F4D23C]"
                    : "border-zinc-800 text-zinc-500"
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <DashCard className="!p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">Weekly challenge</p>
              <p className="mt-2 text-sm font-bold text-white">{TRAILER_COMMUNITY.weeklyChallenge}</p>
              <p className="mt-2 text-sm text-[#F4D23C]">Rank {TRAILER_COMMUNITY.challengeRank}</p>
              <p className="mt-3 text-xs text-zinc-500">Hyrox add-on: {TRAILER_COMMUNITY.hyroxAddOn}</p>
            </DashCard>
            <DashCard className="!p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">Leaderboard</p>
              <ul className="mt-3 space-y-2">
                {TRAILER_COMMUNITY.leaderboardSnippet.map((row) => (
                  <li
                    key={row.rank}
                    className={`flex justify-between text-sm ${
                      row.highlight ? "font-semibold text-[#F4D23C]" : "text-zinc-400"
                    }`}
                  >
                    <span>
                      #{row.rank} {row.name}
                    </span>
                    <span>{row.pts} pts</span>
                  </li>
                ))}
              </ul>
            </DashCard>
            <DashCard className="!p-4 lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-zinc-500">Education library</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {TRAILER_COMMUNITY.education.map((e) => (
                  <span
                    key={e}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300"
                  >
                    {e}
                  </span>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <Calendar className="h-4 w-4 text-[#F4D23C]" />
                {TRAILER_COMMUNITY.checkInPrompt}
              </p>
            </DashCard>
          </div>
        </DashCard>
      </TrailerSection>

      {/* ─── Section 13: Story / Reel Overlay Cards (9:16) ─── */}
      <TrailerSection
        id="reel-cards"
        number={13}
        title="Story / Reel Overlay Cards"
        description="Vertical 9:16 cards for social — crop or screen-record individually."
        layout="full"
      >
        <div className="flex flex-wrap justify-center gap-6">
          {TRAILER_REEL_HEADLINES.map((headline) => (
            <div
              key={headline}
              className="relative flex aspect-[9/16] w-[min(100%,280px)] flex-col justify-end overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-8 shadow-2xl shadow-black/50"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(244,210,60,0.15),transparent)]" />
              <div className="pointer-events-none absolute left-6 top-8 h-10 w-10 rounded-full border border-[#F4D23C]/40 bg-[#F4D23C]/10" />
              <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-[#F4D23C]">
                Hyrox365 Team
              </p>
              <h3 className="relative mt-4 text-2xl font-bold leading-tight tracking-tight text-white">
                {headline}
              </h3>
              <p className="relative mt-6 text-xs text-zinc-500">hybrid365.com</p>
            </div>
          ))}
        </div>
      </TrailerSection>

      <TrailerTeamLaunchPack />

      <footer className="border-t border-zinc-800 py-12 text-center text-xs text-zinc-600">
        <Link href="/internal/programme-preview" className="text-[#F4D23C] hover:underline">
          Programme QA Preview
        </Link>
        <span className="mx-2">·</span>
        Mock data only — not connected to athlete accounts
      </footer>
    </div>
  );
}
