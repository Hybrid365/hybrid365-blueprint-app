"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  DASHBOARD_SECTIONS,
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_CHECK_IN,
  MOCK_COACH_NOTES,
  MOCK_FEEDBACK_PROMPTS,
  MOCK_NEXT_SESSION,
  MOCK_PERFORMANCE_PROFILE,
  MOCK_RACE_PREP,
  MOCK_RESOURCES,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
  type DashboardSectionId,
} from "@/app/lib/hyroxTeamDashboardMock";
import { HyroxThisWeekTrackingCard } from "@/components/hyrox-team/HyroxThisWeekTrackingCard";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { BenchmarksDashboardSection } from "./BenchmarksDashboardSection";
import { CommandCentreHeader } from "./CommandCentreHeader";
import { MobileAnchorBar } from "./MobileAnchorBar";
import { ProgressDashboardSection } from "./ProgressDashboardSection";
import { SectionShell } from "./SectionShell";
import { SessionDrawer } from "./SessionDrawer";
import { StickyActionPanel } from "./StickyActionPanel";
import { WeekSessionCard } from "./WeekSessionCard";
import { scrollToSection } from "./nav";

export function AthleteCommandCentre() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("overview");

  const openSession = useCallback((id: string, title?: string) => {
    setSessionId(id);
    setSessionTitle(title);
  }, []);

  const closeSession = useCallback(() => {
    setSessionId(null);
    setSessionTitle(undefined);
  }, []);

  useEffect(() => {
    const ids = DASHBOARD_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id as DashboardSectionId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const a = MOCK_ATHLETE;
  const next = MOCK_NEXT_SESSION;
  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const completedCount = MOCK_WEEK_SESSIONS.filter((s) => s.status === "complete").length;

  return (
    <div className="pb-16">
      <CommandCentreHeader />
      <MobileAnchorBar activeSection={activeSection} />

      <div className="mt-8 grid gap-10 xl:grid-cols-[1fr_300px] xl:gap-12">
        <main className="min-w-0 space-y-12">
          <SectionShell id="overview" title="Overview" subtitle="Week objective, priorities and programme context">
            <HyroxThisWeekTrackingCard onCompleteCheckIn={() => scrollToSection("check-in")} />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                <p className="text-[10px] font-bold uppercase text-yellow-400/80">{MOCK_WEEK_RATIONALE.weekRole}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{MOCK_WEEK_RATIONALE.whyMatters}</p>
                <ul className="mt-4 space-y-1.5">
                  {MOCK_WEEK_RATIONALE.prioritise.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-zinc-400">
                      <span className="text-yellow-400">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Block progress</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  Week {a.currentWeek}
                  <span className="text-lg text-zinc-600"> / {a.totalWeeks}</span>
                </p>
                <p className="text-sm text-zinc-500">{block.name} · {a.weeklyFocus}</p>
                <div className="mt-4 h-2 rounded-full bg-zinc-950">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${Math.round((a.currentWeek / a.totalWeeks) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="this-week"
            title="This week's training"
            subtitle={`${completedCount}/${MOCK_WEEK_SESSIONS.length} complete · ${MOCK_WEEK_SESSIONS.filter((s) => s.status === "modified").length} modified`}
          >
            <div className="space-y-4">
              {MOCK_WEEK_SESSIONS.map((session) => (
                <WeekSessionCard
                  key={session.id}
                  session={session}
                  onView={() => openSession(session.id, session.name)}
                  onLog={() => openSession(session.id, session.name)}
                />
              ))}
            </div>
          </SectionShell>

          <SectionShell id="next-session" title="Next session" subtitle="Your key action for the week">
            <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900/90 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-yellow-400">{next.day} · {next.dateLabel}</span>
                  <h3 className="mt-2 text-2xl font-bold text-white">{next.name}</h3>
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs ${sessionTypeStyle(next.type)}`}>
                    {next.type} · Key session
                  </span>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">{next.objective}</p>
              <p className="mt-3 text-sm text-zinc-500">
                {next.duration} · RPE {next.rpeTarget}
              </p>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Coach note</p>
                <p className="mt-1 text-sm text-zinc-400">{next.coachNote}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openSession(next.sessionId, next.name)}
                  className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  View session
                </button>
                <button
                  type="button"
                  onClick={() => openSession(next.sessionId, next.name)}
                  className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  Log result
                </button>
              </div>
            </div>
          </SectionShell>

          <ProgressDashboardSection />
          <BenchmarksDashboardSection />

          <SectionShell id="check-in" title="Weekly check-in" subtitle="Recovery, load and availability for coach review">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-semibold text-white">Status: {MOCK_CHECK_IN.status}</span>
                <span className="text-sm text-zinc-500">Due {MOCK_CHECK_IN.dueLabel}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Sleep, energy, stress, soreness, bodyweight, session completion, and next week availability.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(MOCK_CHECK_IN.lastMetrics).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                    <p className="font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
              >
                Complete weekly check-in
              </button>
            </div>
          </SectionShell>

          <SectionShell id="coach-notes" title="Coach notes" subtitle="Personalised direction for this block">
            <div className="grid gap-3 sm:grid-cols-2">
              <CoachCard label="Current focus" text={MOCK_COACH_NOTES.currentFocus} primary />
              <CoachCard label="Recent adjustment" text={MOCK_COACH_NOTES.recentAdjustment} />
              <CoachCard label="Next priority" text={MOCK_COACH_NOTES.nextPriority} />
              <CoachCard label="Avoid this week" text={MOCK_COACH_NOTES.avoidThisWeek} warn />
            </div>
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-400/5 p-5">
              <p className="text-[10px] font-bold uppercase text-yellow-400/80">Why this week is built this way</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{MOCK_COACH_NOTES.whyThisWeek}</p>
            </div>
          </SectionShell>

          <SectionShell
            id="feedback"
            title="This week's feedback & content prompts"
            subtitle="Supports coaching review, movement quality and accountability"
          >
            <p className="text-sm text-zinc-400">{MOCK_FEEDBACK_PROMPTS.intro}</p>
            <ul className="mt-4 space-y-3">
              {MOCK_FEEDBACK_PROMPTS.items.map((item) => (
                <li
                  key={item.id}
                  className="flex list-none items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionShell>

          <SectionShell
            id="race-prep"
            title="Race strategy & prep"
            subtitle={MOCK_RACE_PREP.locked ? "Unlocks closer to race week" : "Your race-day playbook"}
          >
            <div className={`rounded-2xl border p-6 ${MOCK_RACE_PREP.locked ? "border-zinc-800 opacity-80" : "border-yellow-500/20"}`}>
              {MOCK_RACE_PREP.locked ? (
                <span className="mb-4 inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                  <Lock className="h-3 w-3" />
                  Unlocks Week 8
                </span>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <PrepField label="Target run pace" value={MOCK_RACE_PREP.targetRunPace} />
                <PrepField label="Station strategy" value={MOCK_RACE_PREP.stationStrategy} />
                <PrepField label="Fuelling plan" value={MOCK_RACE_PREP.fuelling} />
                <PrepField label="Taper plan" value={MOCK_RACE_PREP.taper} />
                <PrepField label="Race-day checklist" value={MOCK_RACE_PREP.raceDayChecklist} className="sm:col-span-2" />
              </div>
            </div>
          </SectionShell>

          <SectionShell id="resources" title="Hyrox resources" subtitle="Guides and reference material">
            <div className="grid gap-3 sm:grid-cols-2">
              {MOCK_RESOURCES.map((r) => (
                <button
                  key={r.title}
                  type="button"
                  className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left hover:border-yellow-500/25"
                >
                  <BookOpen className="h-5 w-5 shrink-0 text-yellow-400/80" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="text-xs text-zinc-500">{r.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </button>
              ))}
            </div>
          </SectionShell>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-bold text-white">Performance profile</h3>
            <p className="mt-1 text-sm text-zinc-500">{MOCK_PERFORMANCE_PROFILE.athleteType}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PrepField label="Main limiter" value={MOCK_PERFORMANCE_PROFILE.mainLimiter} />
              <PrepField label="Weekly structure" value={MOCK_PERFORMANCE_PROFILE.weeklyStructure} />
            </div>
            <Link href="/athlete/assessment" className="mt-4 inline-flex text-sm font-semibold text-yellow-400">
              View full assessment →
            </Link>
          </section>
        </main>

        <StickyActionPanel
          activeSection={activeSection}
          onViewSession={() => openSession(next.sessionId, next.name)}
          onLogResult={() => openSession(next.sessionId, next.name)}
          onCheckIn={() => scrollToSection("check-in")}
        />
      </div>

      <SessionDrawer sessionId={sessionId} sessionTitle={sessionTitle} onClose={closeSession} />
    </div>
  );
}

function CoachCard({
  label,
  text,
  primary,
  warn,
}: {
  label: string;
  text: string;
  primary?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn ? "border-red-500/20 bg-red-500/5" : primary ? "border-yellow-500/25 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950/50"
      }`}
    >
      <p className={`text-[10px] font-bold uppercase ${warn ? "text-red-300/80" : "text-zinc-500"}`}>{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{text}</p>
    </div>
  );
}

function PrepField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 ${className}`}>
      <p className="text-[10px] font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  );
}
