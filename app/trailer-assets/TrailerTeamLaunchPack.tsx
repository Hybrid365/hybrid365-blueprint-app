"use client";

import {
  CheckCircle2,
  Home,
  LineChart,
  MessageSquare,
  Target,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  LAUNCH_BENCHMARKS,
  LAUNCH_CHECK_IN,
  LAUNCH_COACH_ADJUSTMENTS,
  LAUNCH_DOCUMENTED_STAGES,
  LAUNCH_JOURNEY_STAGES,
  LAUNCH_MOBILE_SCREENS,
  LAUNCH_OPENING_CARDS,
  LAUNCH_PROGRESS_METRICS,
  LAUNCH_RANDOM_TRAINING,
  LAUNCH_REFUSING_AVERAGE,
  LAUNCH_STRUCTURED_TRAINING,
  LAUNCH_TEAM_ATHLETE,
  LAUNCH_WHATS_INCLUDED,
} from "@/app/lib/trailerTeamLaunchMock";
import { DashCard, ProgressBar, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  BodyweightLineChart,
  LaunchRunVolumeBarChart,
  ScoreRing,
  ThresholdRunVolumeChart,
} from "./TrailerTeamCharts";
import {
  AssetRow,
  BadgeStamp,
  Frame169,
  Frame916,
  FrameRow,
  OverlayLandscape,
  OverlayVertical,
  PhoneFrame,
} from "./TrailerTeamFrames";

function CinematicCopy({
  headline,
  sub,
  align = "center",
}: {
  headline: string;
  sub?: string;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#F4D23C]">Hybrid365</p>
      <h3
        className={`mt-4 max-w-3xl font-bold leading-[1.05] tracking-tight text-white ${
          headline.length > 30 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
        }`}
      >
        {headline}
      </h3>
      {sub ? <p className="mt-4 max-w-xl text-sm text-zinc-400">{sub}</p> : null}
    </div>
  );
}

function SubPackHeading({ n, title, desc }: { n: string; title: string; desc?: string }) {
  return (
    <header className="mb-10 border-t border-zinc-800/80 pt-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4D23C]">{n}</p>
      <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{title}</h3>
      {desc ? <p className="mt-2 max-w-2xl text-sm text-zinc-500">{desc}</p> : null}
    </header>
  );
}

export default function TrailerTeamLaunchPack() {
  const a = LAUNCH_TEAM_ATHLETE;

  return (
    <section id="team-launch-pack" className="scroll-mt-6 border-t-4 border-[#F4D23C]/30">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#F4D23C]">
            Appended asset pack
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trailer Asset Pack – Hyrox Team Launch
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400">
            Cinematic cards, timelines, dashboard UI and mobile overlays for the Hybrid365 Hyrox Team
            trailer. Mock data only — screenshot each frame below.
          </p>
        </header>

        {/* 1. Opening ethos */}
        <SubPackHeading
          n="Pack §1"
          title="Opening Ethos Trailer Cards"
          desc="Cinematic full-screen cards for the opening trailer."
        />
        {LAUNCH_OPENING_CARDS.map((headline) => (
          <AssetRow key={headline} label={headline} hint="16:9 · 9:16 · badge">
            <FrameRow>
              <Frame169>
                <CinematicCopy headline={headline} />
              </Frame169>
              <Frame916>
                <CinematicCopy headline={headline} align="left" />
              </Frame916>
              <BadgeStamp>
                <span className="text-xs font-bold uppercase tracking-wide text-white">{headline}</span>
              </BadgeStamp>
            </FrameRow>
          </AssetRow>
        ))}

        {/* 2. Problem / structure */}
        <SubPackHeading n="Pack §2" title="Problem / Structure Comparison" />
        <AssetRow label="Training hard isn't enough" hint="16:9 · 9:16 · overlay">
          <FrameRow>
            <Frame169>
              <div className="w-full max-w-4xl text-center">
                <CinematicCopy
                  headline="Training hard isn't enough."
                  sub="Hyrox rewards structure."
                />
                <div className="mt-10 grid gap-4 sm:grid-cols-2 text-left">
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                    <p className="text-sm font-bold text-red-300/90">Random Training</p>
                    <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                      {LAUNCH_RANDOM_TRAINING.map((x) => (
                        <li key={x}>· {x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#F4D23C]/30 bg-[#F4D23C]/5 p-6">
                    <p className="text-sm font-bold text-[#F4D23C]">Structured Hyrox Build</p>
                    <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                      {LAUNCH_STRUCTURED_TRAINING.map((x) => (
                        <li key={x} className="flex gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F4D23C]" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Frame169>
            <Frame916>
              <CinematicCopy headline="Training hard isn't enough." sub="Hyrox rewards structure." align="left" />
              <div className="mt-6 space-y-3 text-sm">
                <p className="text-red-300/80">Random → no plan</p>
                <p className="text-[#F4D23C]">Structured → personalised + tested</p>
              </div>
            </Frame916>
            <OverlayLandscape>
              <p className="text-lg font-bold text-white">Hyrox rewards structure.</p>
              <p className="mt-2 text-sm text-zinc-400">Not just hard sessions.</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 3. Journey timeline */}
        <SubPackHeading n="Pack §3" title="Full Journey Timeline — Testing Day to Race Day" />
        <AssetRow label="From Testing Day to Race Day" hint="horizontal · vertical · compact">
          <FrameRow>
            <Frame169>
              <div className="w-full px-4">
                <p className="text-center text-2xl font-bold text-white">From Testing Day to Race Day</p>
                <div className="mt-10 flex flex-wrap justify-between gap-2">
                  {LAUNCH_JOURNEY_STAGES.map((s, i) => (
                    <div key={s.label} className="flex flex-col items-center" style={{ width: "7.5%" }}>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          i < 4 ? "bg-[#F4D23C] text-zinc-950" : "border border-zinc-600 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {s.step}
                      </div>
                      <p className="mt-2 text-center text-[8px] leading-tight text-zinc-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-4 h-0.5 w-[92%] bg-gradient-to-r from-[#F4D23C] via-zinc-600 to-[#F4D23C]/40" />
              </div>
            </Frame169>
            <Frame916>
              <p className="text-xl font-bold text-white">From Testing Day to Race Day</p>
              <div className="mt-8 space-y-4">
                {LAUNCH_JOURNEY_STAGES.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4D23C]/20 text-xs font-bold text-[#F4D23C]">
                      {s.step}
                    </span>
                    <span className="text-sm text-zinc-300">{s.label}</span>
                  </div>
                ))}
              </div>
            </Frame916>
            <OverlayLandscape>
              <p className="font-bold text-white">Testing Day → Race Day</p>
              <p className="mt-1 text-xs text-zinc-500">12-stage athlete development roadmap</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 4. What's included */}
        <SubPackHeading n="Pack §4" title="What's Included" />
        <AssetRow label="Inside the Hybrid365 Hyrox Team">
          <FrameRow>
            <Frame169>
              <p className="mb-8 text-2xl font-bold text-white">Inside the Hybrid365 Hyrox Team</p>
              <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
                {LAUNCH_WHATS_INCLUDED.map((f) => (
                  <div
                    key={f}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-4 text-center text-xs font-medium text-zinc-200"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </Frame169>
            <Frame916>
              <p className="text-lg font-bold text-white">Inside the Hyrox Team</p>
              <ul className="mt-6 space-y-3">
                {LAUNCH_WHATS_INCLUDED.slice(0, 8).map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F4D23C]" />
                    {f}
                  </li>
                ))}
              </ul>
            </Frame916>
            <OverlayLandscape>
              <p className="text-sm font-bold text-[#F4D23C]">1-1 programme + team accountability</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 5. 1-1 + team model */}
        <SubPackHeading n="Pack §5" title="1-1 + Team Model" />
        <AssetRow label="Coached individually. Built as a team.">
          <FrameRow>
            <Frame169>
              <CinematicCopy headline="Coached individually. Built as a team." />
              <div className="relative mt-8 w-full max-w-3xl">
                <div className="mx-auto rounded-2xl border border-[#F4D23C]/40 bg-[#F4D23C]/10 px-8 py-6 text-center">
                  <p className="text-lg font-bold text-white">Your Personal Programme</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  {[
                    "athlete assessment",
                    "weekly structure",
                    "coach feedback",
                    "benchmark targets",
                    "race adjustments",
                    "team standards",
                    "accountability",
                    "documented progress",
                    "race-day support",
                  ].map((t) => (
                    <span
                      key={t}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Frame169>
            <Frame916>
              <CinematicCopy
                headline="Coached individually."
                sub="Built as a team."
                align="left"
              />
            </Frame916>
            <OverlayLandscape>
              <p className="font-bold text-white">1-1 coaching + team layer</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 6. Athlete profile UI */}
        <SubPackHeading n="Pack §6" title="Complete Athlete Profile UI" />
        <AssetRow label="Team Athlete 01 dashboard">
          <FrameRow>
            <Frame169>
              <div className="w-full text-left">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F4D23C]">
                      Hyrox Team
                    </span>
                    <h3 className="mt-2 text-2xl font-bold text-white">{a.name}</h3>
                    <p className="text-sm text-zinc-500">{a.programme} · {a.raceLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    {["Overview", "Programme", "Progress", "Check-In"].map((tab, i) => (
                      <span
                        key={tab}
                        className={`rounded-lg px-3 py-1.5 text-xs ${
                          i === 0
                            ? "bg-[#F4D23C]/15 text-[#F4D23C]"
                            : "border border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile label="Race countdown" value={`${a.raceCountdownWeeks} wks`} icon={<Timer className="h-4 w-4 text-[#F4D23C]" />} />
                  <StatTile label="Race readiness" value={`${a.raceReadiness}%`} icon={<Target className="h-4 w-4 text-[#F4D23C]" />} />
                  <StatTile label="Current week" value={a.currentWeek} />
                  <StatTile label="Check-in" value="Reviewed" />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <DashCard className="!p-4">
                    <ProgressBar pct={a.weeklyCompletionPct} label="Weekly completion" />
                    <p className="mt-3 text-xs text-zinc-500">{a.phase}</p>
                  </DashCard>
                  <DashCard highlight className="!p-4">
                    <p className="text-[10px] uppercase text-zinc-500">Coach note</p>
                    <p className="mt-2 text-sm text-zinc-300">{a.coachNote}</p>
                  </DashCard>
                </div>
              </div>
            </Frame169>
            <PhoneFrame>
              <div className="flex h-full flex-col bg-zinc-950 p-4">
                <p className="text-xs font-bold text-[#F4D23C]">Hyrox Team</p>
                <p className="text-lg font-bold text-white">{a.name}</p>
                <p className="text-xs text-zinc-500">{a.currentWeek}</p>
                <div className="mt-4 rounded-xl border border-zinc-800 p-3">
                  <p className="text-[10px] text-zinc-500">Next session</p>
                  <p className="text-sm font-semibold text-white">{a.nextSession.title}</p>
                </div>
                <div className="mt-auto flex justify-around border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
                  <Home className="h-4 w-4 text-[#F4D23C]" />
                  <LineChart className="h-4 w-4" />
                  <MessageSquare className="h-4 w-4" />
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </PhoneFrame>
            <OverlayLandscape>
              <p className="font-bold text-white">{a.name}</p>
              <p className="text-sm text-[#F4D23C]">Race readiness {a.raceReadiness}%</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 7. Progress tracking */}
        <SubPackHeading n="Pack §7" title="Progress Tracking UI" />
        <AssetRow label="Race readiness dashboard">
          <FrameRow>
            <Frame169>
              <DashCard highlight className="w-full !p-6">
                <SectionHeading title="Progress Tracking" />
                <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
                  {LAUNCH_PROGRESS_METRICS.map((m) => (
                    <ScoreRing key={m.label} value={m.value} label={m.label} delta={m.delta} />
                  ))}
                </div>
              </DashCard>
            </Frame169>
            <Frame916>
              <p className="text-lg font-bold text-white">Race Readiness</p>
              <p className="mt-2 text-4xl font-bold text-[#F4D23C]">82%</p>
              <div className="mt-8 space-y-3">
                {LAUNCH_PROGRESS_METRICS.slice(1, 5).map((m) => (
                  <div key={m.label} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{m.label}</span>
                    <span className="text-emerald-400">{m.delta}</span>
                  </div>
                ))}
              </div>
            </Frame916>
            <OverlayLandscape>
              <p className="text-2xl font-bold text-[#F4D23C]">82%</p>
              <p className="text-sm text-zinc-400">Race readiness</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 8. Threshold run volume */}
        <SubPackHeading n="Pack §8" title="Threshold Run Volume Progression" />
        <AssetRow label="Threshold run minutes">
          <FrameRow>
            <Frame169>
              <DashCard className="w-full !p-6">
                <SectionHeading title="Threshold Run Volume" />
                <ThresholdRunVolumeChart />
                <p className="mt-4 text-xs text-zinc-500">
                  Controlled threshold progression based on testing, HR and RPE.
                </p>
              </DashCard>
            </Frame169>
            <PhoneFrame>
              <div className="p-4">
                <p className="text-sm font-bold text-white">Threshold Run</p>
                <ThresholdRunVolumeChart compact />
              </div>
            </PhoneFrame>
            <OverlayLandscape>
              <p className="font-bold text-white">Threshold Run Volume</p>
              <p className="text-[#F4D23C]">24 → 56 min</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 9. Weekly run volume */}
        <SubPackHeading n="Pack §9" title="Weekly Run Volume Progression" />
        <AssetRow label="Weekly run km">
          <FrameRow>
            <Frame169>
              <DashCard className="w-full !p-6">
                <SectionHeading title="Weekly Run Volume" />
                <LaunchRunVolumeBarChart />
                <p className="mt-4 text-xs text-zinc-500">
                  Progressive volume. Managed fatigue. Built for race day.
                </p>
              </DashCard>
            </Frame169>
            <PhoneFrame>
              <div className="p-4">
                <p className="text-sm font-bold text-white">Run Volume</p>
                <LaunchRunVolumeBarChart compact />
              </div>
            </PhoneFrame>
            <OverlayLandscape>
              <p className="font-bold text-white">40 km peak week</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 10. Bodyweight */}
        <SubPackHeading n="Pack §10" title="Bodyweight / Performance Tracking" />
        <AssetRow label="Bodyweight tracking">
          <FrameRow>
            <Frame169>
              <DashCard className="w-full !p-6">
                <SectionHeading title="Bodyweight Tracking" />
                <div className="mb-4 flex gap-6 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500">Start</p>
                    <p className="font-bold text-white">{a.bodyweight.start}kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#F4D23C]">Current</p>
                    <p className="font-bold text-[#F4D23C]">{a.bodyweight.current}kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500">Performance range</p>
                    <p className="font-bold text-white">{a.bodyweight.range}kg</p>
                  </div>
                </div>
                <BodyweightLineChart />
                <p className="mt-4 text-xs text-zinc-500">
                  Tracked to support recovery, fuelling and race readiness.
                </p>
              </DashCard>
            </Frame169>
            <OverlayLandscape>
              <p className="font-bold text-white">82.4 kg</p>
              <p className="text-xs text-zinc-500">Performance range 81–83 kg</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 11. Benchmarks */}
        <SubPackHeading n="Pack §11" title="Benchmark Testing UI" />
        <AssetRow label="Benchmark grid">
          <FrameRow>
            <Frame169>
              <div className="w-full">
                <SectionHeading title="Benchmark Testing" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {LAUNCH_BENCHMARKS.map((b) => (
                    <DashCard key={b.name} className="!p-4">
                      <p className="text-lg">{b.icon}</p>
                      <p className="mt-1 text-sm font-bold text-white">{b.name}</p>
                      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
                        <div>
                          <p className="text-zinc-600">Prev</p>
                          <p className="text-zinc-400">{b.previous}</p>
                        </div>
                        <div>
                          <p className="text-[#F4D23C]">Now</p>
                          <p className="font-bold text-[#F4D23C]">{b.current}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Target</p>
                          <p className="text-white">{b.target}</p>
                        </div>
                      </div>
                      {b.up ? (
                        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                          <TrendingUp className="h-3 w-3" /> Improving
                        </p>
                      ) : null}
                    </DashCard>
                  ))}
                </div>
              </div>
            </Frame169>
            <PhoneFrame>
              <div className="p-4">
                <p className="font-bold text-white">Benchmarks</p>
                {LAUNCH_BENCHMARKS.slice(0, 4).map((b) => (
                  <div key={b.name} className="mt-3 rounded-lg border border-zinc-800 p-2 text-xs">
                    <p className="font-semibold text-white">{b.name}</p>
                    <p className="text-[#F4D23C]">{b.current}</p>
                  </div>
                ))}
              </div>
            </PhoneFrame>
          </FrameRow>
        </AssetRow>

        {/* 12. Check-in */}
        <SubPackHeading n="Pack §12" title="Weekly Check-In + Coach Feedback" />
        <AssetRow label="Check-in UI">
          <FrameRow>
            <Frame169>
              <DashCard highlight className="w-full !p-6">
                <SectionHeading title="Weekly Coaching Check-In" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["Sleep", LAUNCH_CHECK_IN.sleep],
                      ["Energy", LAUNCH_CHECK_IN.energy],
                      ["Soreness", LAUNCH_CHECK_IN.soreness],
                      ["Bodyweight", LAUNCH_CHECK_IN.bodyweight],
                      ["Sessions", LAUNCH_CHECK_IN.sessionsCompleted],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                      <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                      <p className="text-lg font-bold text-white">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <p className="text-[10px] uppercase text-zinc-500">Athlete note</p>
                    <p className="mt-2 text-sm text-zinc-300">{LAUNCH_CHECK_IN.athleteNote}</p>
                  </div>
                  <div className="rounded-xl border border-[#F4D23C]/20 bg-[#F4D23C]/5 p-4">
                    <p className="text-[10px] uppercase text-[#F4D23C]">Coach feedback</p>
                    <p className="mt-2 text-sm text-zinc-200">{LAUNCH_CHECK_IN.coachFeedback}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Submit Check-In", "View Coach Feedback", "Update Metrics"].map((btn) => (
                    <span
                      key={btn}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200"
                    >
                      {btn}
                    </span>
                  ))}
                </div>
              </DashCard>
            </Frame169>
            <PhoneFrame>
              <div className="p-4">
                <p className="font-bold text-white">Check-In</p>
                <p className="mt-4 text-sm text-zinc-400">{LAUNCH_CHECK_IN.athleteNote}</p>
                <p className="mt-4 rounded-lg bg-[#F4D23C]/10 p-3 text-xs text-[#F4D23C]">
                  {LAUNCH_CHECK_IN.coachFeedback}
                </p>
              </div>
            </PhoneFrame>
            <OverlayLandscape>
              <p className="font-bold text-white">Coach reviewed</p>
              <p className="mt-2 text-sm text-zinc-400">{LAUNCH_CHECK_IN.coachFeedback}</p>
            </OverlayLandscape>
          </FrameRow>
        </AssetRow>

        {/* 13. Coach adjustments */}
        <SubPackHeading n="Pack §13" title="Coach Adjustment Overlay Cards" />
        <AssetRow label="Coach adjustment overlays">
          <FrameRow>
            <OverlayLandscape>
              <p className="flex items-center gap-2 text-sm font-bold text-[#F4D23C]">
                <MessageSquare className="h-4 w-4" /> Coach Adjustment
              </p>
              <p className="mt-2 text-xs text-zinc-500">Based on this week&apos;s check-in:</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                {LAUNCH_COACH_ADJUSTMENTS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#F4D23C]">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </OverlayLandscape>
            <OverlayVertical>
              <p className="text-sm font-bold text-[#F4D23C]">Coach Adjustment</p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                {LAUNCH_COACH_ADJUSTMENTS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </OverlayVertical>
            <BadgeStamp>
              <span className="text-xs font-bold text-white">Sled −15%</span>
            </BadgeStamp>
          </FrameRow>
        </AssetRow>

        {/* 14. Refusing average */}
        <SubPackHeading n="Pack §14" title="Team Identity / Refusing Average" />
        {LAUNCH_REFUSING_AVERAGE.map((sub) => (
          <AssetRow key={sub} label="REFUSING AVERAGE variant">
            <FrameRow>
              <Frame169>
                <CinematicCopy headline="REFUSING AVERAGE" sub={sub} />
              </Frame169>
              <Frame916>
                <p className="text-3xl font-bold text-white">REFUSING AVERAGE</p>
                <p className="mt-4 text-sm text-zinc-400">{sub}</p>
              </Frame916>
              <BadgeStamp>
                <span className="text-xs font-bold uppercase text-[#F4D23C]">Refusing Average</span>
              </BadgeStamp>
            </FrameRow>
          </AssetRow>
        ))}

        {/* 15. Documented journey */}
        <SubPackHeading n="Pack §15" title="Documented Athlete Journey" />
        <AssetRow label="The Full Process. Documented.">
          <FrameRow>
            <Frame169>
              <p className="mb-6 text-2xl font-bold text-white">The Full Process. Documented.</p>
              <div className="grid w-full max-w-4xl grid-cols-4 gap-3">
                {LAUNCH_DOCUMENTED_STAGES.map((stage) => (
                  <div
                    key={stage}
                    className="flex aspect-video flex-col justify-end rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
                  >
                    <div className="mb-2 h-12 rounded-lg bg-zinc-800/80" />
                    <p className="text-xs font-medium text-zinc-300">{stage}</p>
                  </div>
                ))}
                <div className="col-span-2 flex aspect-video items-center justify-center rounded-xl border border-[#F4D23C]/20 bg-[#F4D23C]/5 p-4">
                  <p className="text-center text-sm text-zinc-400">UI + training footage · behind the scenes</p>
                </div>
              </div>
            </Frame169>
            <Frame916>
              <p className="text-xl font-bold text-white">The Full Process. Documented.</p>
              <div className="mt-6 space-y-2">
                {LAUNCH_DOCUMENTED_STAGES.map((s) => (
                  <p key={s} className="text-sm text-zinc-400">
                    · {s}
                  </p>
                ))}
              </div>
            </Frame916>
          </FrameRow>
        </AssetRow>

        {/* 16. Final CTA */}
        <SubPackHeading n="Pack §16" title="Final CTA" />
        <AssetRow label="Hybrid365 Hyrox Team CTA">
          <FrameRow>
            <Frame169>
              <CinematicCopy
                headline="Hybrid365 Hyrox Team"
                sub="First intake opening soon · 1-1 personalised coaching · Team accountability · Full athlete dashboard"
              />
              <p className="mt-8 rounded-full border border-[#F4D23C]/40 bg-[#F4D23C]/10 px-6 py-3 text-sm font-bold text-[#F4D23C]">
                Comment HYROX to apply
              </p>
            </Frame169>
            <Frame916>
              <p className="text-2xl font-bold text-white">Hybrid365 Hyrox Team</p>
              <p className="mt-4 text-sm text-zinc-400">Applications opening soon</p>
              <p className="mt-8 text-xs font-bold uppercase tracking-widest text-[#F4D23C]">
                Built for athletes refusing average
              </p>
            </Frame916>
            <BadgeStamp>
              <span className="text-xs font-bold text-white">Apply · HYROX</span>
            </BadgeStamp>
          </FrameRow>
        </AssetRow>

        {/* 17. Mobile overlays */}
        <SubPackHeading n="Pack §17" title="Mobile UI Overlay Screen Set" />
        <div className="flex flex-wrap justify-center gap-8">
          {LAUNCH_MOBILE_SCREENS.map((screen) => (
            <AssetRow key={screen.id} label={screen.label}>
              <PhoneFrame>
                <div className="flex h-full flex-col bg-zinc-950">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase text-[#F4D23C]">Hybrid365</p>
                    <p className="text-base font-bold text-white">{screen.title}</p>
                    <p className="text-xs text-zinc-500">{screen.sub}</p>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/80" />
                    <div className="mt-3 h-16 rounded-xl border border-zinc-800 bg-zinc-900/60" />
                    <div className="mt-3 h-16 rounded-xl border border-zinc-800 bg-zinc-900/60" />
                  </div>
                  <div className="flex justify-around border-t border-zinc-800 py-3 text-[9px] text-zinc-600">
                    {LAUNCH_MOBILE_SCREENS.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className={s.id === screen.id ? "text-[#F4D23C]" : ""}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            </AssetRow>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-zinc-600">
          End of Hyrox Team Launch pack · scroll up for original trailer assets (sections 1–13)
        </p>
      </div>
    </section>
  );
}
