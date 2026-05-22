"use client";

import Link from "next/link";
import { AthletePortalNavLink } from "./AthletePortalNavLink";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Flag,
  MessageSquare,
  Play,
} from "lucide-react";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_BENCHMARK_SNAPSHOT,
  MOCK_CHECK_IN,
  MOCK_COACH_NOTES,
  MOCK_NEXT_SESSION,
  MOCK_PERFORMANCE_METRICS,
  MOCK_PROGRESS_STATS,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
  type HyroxSession,
} from "@/app/lib/hyroxTeamDashboardMock";
import { BenchmarkSnapshotStrip } from "@/components/dashboard/BenchmarkSnapshotStrip";
import { HyroxThisWeekTrackingCard } from "@/components/hyrox-team/HyroxThisWeekTrackingCard";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  nextSessionDisplayForDashboard,
  sessionDetailFromHyroxSession,
} from "@/app/lib/hyroxAthleteDashboardLive";
import { portalAthleteDisplayName } from "@/app/lib/hyroxAthletePortalDisplay";
import { ChartDataPlaceholder } from "./ChartDataPlaceholder";
import { ThresholdProgressionChart } from "./DashboardCharts";
import { CommandCentreHeader } from "./CommandCentreHeader";
import { HomeStickyActions } from "./HomeStickyActions";
import { HubLinkCard } from "./HubLinkCard";
import { SessionDrawer } from "./SessionDrawer";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import {
  BtnPrimary,
  BtnLinkSecondary,
  LinkCta,
  PageContent,
  SectionTitle,
  SnapshotPanel,
  StatusBadge,
  athleteCard,
  athleteCardHighlight,
  athleteCardInteractive,
  athleteCardPadding,
  eyebrowClass,
} from "./athleteUi";
import { useAthletePortal } from "./athletePortalContext";

function HomePriorityTile({
  label,
  value,
  sub,
  href,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  warn?: boolean;
}) {
  const className = `${athleteCardInteractive} p-4 ${warn ? "border-amber-500/30 bg-amber-950/10" : ""}`;

  if (href.startsWith("/athlete/")) {
    return (
      <AthletePortalNavLink href={href} className={className}>
        <p className={`${eyebrowClass} !tracking-[0.15em]`}>{label}</p>
        <p className={`mt-1.5 line-clamp-2 text-sm font-bold leading-snug ${warn ? "text-amber-200" : "text-white"}`}>
          {value}
        </p>
        {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
      </AthletePortalNavLink>
    );
  }

  return (
    <Link href={href} className={className}>
      <p className={`${eyebrowClass} !tracking-[0.15em]`}>{label}</p>
      <p className={`mt-1.5 line-clamp-2 text-sm font-bold leading-snug ${warn ? "text-amber-200" : "text-white"}`}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </Link>
  );
}

const EMPTY_WEEK_RATIONALE = {
  weekRole: "Training week",
  whyMatters: "",
  prioritise: [] as string[],
  coachNote: "",
};

export function AthleteHomeDashboard({ useLiveProgramme = false }: { useLiveProgramme?: boolean }) {
  const router = useRouter();
  const {
    portalAthlete,
    useMockPreview,
    liveProgrammeLoading,
    programmePublishedLive,
    reloadLiveProgramme,
  } = useAthletePortal();
  const { dashboardLive } = useAthleteDashboardLive();
  const useLive = useLiveProgramme && Boolean(dashboardLive);
  const showLiveLoading = useLiveProgramme && liveProgrammeLoading && !dashboardLive;
  const useMockData = useMockPreview;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [drawerSession, setDrawerSession] = useState<HyroxSession | null>(null);
  const [drawerShowLogForm, setDrawerShowLogForm] = useState(false);
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);

  const a = useLive && dashboardLive
    ? {
        name: dashboardLive.athleteName,
        blockId: dashboardLive.blockId,
        currentWeek: dashboardLive.currentWeek,
        totalWeeks: dashboardLive.totalWeeks,
      }
    : useMockData
      ? { ...MOCK_ATHLETE, name: portalAthleteDisplayName(portalAthlete) }
      : {
          name: portalAthleteDisplayName(portalAthlete),
          blockId: 1 as 1 | 2 | 3,
          currentWeek: 1,
          totalWeeks: 12,
        };

  const weekRationale =
    useLive && dashboardLive
      ? dashboardLive.weekRationale
      : useMockData
        ? MOCK_WEEK_RATIONALE
        : EMPTY_WEEK_RATIONALE;
  const weekSessions =
    useLive && dashboardLive ? dashboardLive.sortedSessions : useMockData ? MOCK_WEEK_SESSIONS : [];
  const next =
    useLive && dashboardLive
      ? nextSessionDisplayForDashboard(dashboardLive)
      : useMockData
        ? { ...MOCK_NEXT_SESSION, actionable: true }
        : {
            ...MOCK_NEXT_SESSION,
            sessionId: "",
            name: "Loading programme…",
            objective: "",
            actionable: false,
          };
  const stats =
    useLive && dashboardLive
      ? {
          weeklyCompletionPct: dashboardLive.weeklyCompletionPct,
          sessionsCompleted: dashboardLive.sessionsCompleted,
          sessionsPlanned: dashboardLive.sessionsPlanned,
        }
      : useMockData
        ? MOCK_PROGRESS_STATS
        : { weeklyCompletionPct: 0, sessionsCompleted: 0, sessionsPlanned: 0 };
  const m = useLive && dashboardLive
    ? {
        raceReadiness: {
          value: dashboardLive.raceReadiness.awaiting ? 0 : dashboardLive.weeklyCompletionPct,
          delta: dashboardLive.raceReadiness.sub ?? "",
        },
        consistency: { value: dashboardLive.weeklyCompletionPct, delta: dashboardLive.consistency.sub ?? "" },
      }
    : useMockData
      ? MOCK_PERFORMANCE_METRICS
      : {
          raceReadiness: { value: 0, delta: "Awaiting data" },
          consistency: { value: 0, delta: "" },
        };
  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const upcoming =
    useLive && dashboardLive
      ? dashboardLive.upcomingThisWeek
      : useMockData
        ? weekSessions.filter((s) => s.status === "upcoming").slice(0, 2)
        : [];
  const checkInDue = useLive && dashboardLive ? dashboardLive.checkInDue : useMockData && MOCK_CHECK_IN.status === "Due";
  const checkInStatus =
    useLive && dashboardLive ? dashboardLive.checkInStatus : useMockData ? MOCK_CHECK_IN.status : "After Week 1";
  const checkInSub =
    useLive && dashboardLive
      ? dashboardLive.checkInSub
      : useMockData
        ? `Due ${MOCK_CHECK_IN.dueLabel}`
        : "Weekly check-ins unlock after your first training week";
  const benchmarkItems =
    useLive && dashboardLive ? dashboardLive.benchmarkSnapshot : useMockData ? MOCK_BENCHMARK_SNAPSHOT : [];
  const benchmarksLoading = useLive && dashboardLive ? dashboardLive.benchmarksLoading : false;
  const benchmarksError = useLive && dashboardLive ? dashboardLive.benchmarksError : null;
  const coachFocus =
    useLive && dashboardLive
      ? dashboardLive.coachingFocus
      : useMockData
        ? MOCK_COACH_NOTES.currentFocus
        : "Your coach will share focus notes when your programme is live.";

  const openSession = useCallback(
    (id: string, title?: string, opts?: { showLogForm?: boolean }) => {
      if (!id) return;
      setSessionId(id);
      setSessionTitle(title);
      setDrawerShowLogForm(Boolean(opts?.showLogForm));
      const hit = weekSessions.find((s) => s.id === id) ?? null;
      setDrawerSession(hit);
      setSessionDetailOverride(hit ? sessionDetailFromHyroxSession(hit) : null);
    },
    [weekSessions]
  );

  const handleSessionUpdated = useCallback(
    async (updated: HyroxSession | null) => {
      if (updated) {
        setDrawerSession(updated);
        setSessionDetailOverride(sessionDetailFromHyroxSession(updated));
      }
      if (programmePublishedLive && !useMockPreview) {
        await reloadLiveProgramme();
      }
    },
    [programmePublishedLive, useMockPreview, reloadLiveProgramme]
  );

  return (
    <PageContent width="full" className="!max-w-none">
      {showLiveLoading ? (
        <p className="mb-4 text-sm text-zinc-500">Loading your programme…</p>
      ) : null}
      <CommandCentreHeader />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HomePriorityTile
          label="Next session"
          value={next.name}
          sub={`${next.day} · ${next.duration}`}
          href="/athlete/programme"
        />
        <HomePriorityTile
          label="Check-in"
          value={checkInStatus}
          sub={checkInSub}
          href="/athlete/check-in"
          warn={checkInDue}
        />
        <HomePriorityTile
          label="Weekly focus"
          value={weekRationale.weekRole}
          sub={`Block ${a.blockId} · Week ${a.currentWeek}`}
          href="/athlete/coach-notes"
        />
        <HomePriorityTile
          label="Race readiness"
          value={
            useLive && dashboardLive?.raceReadiness.awaiting
              ? dashboardLive.raceReadiness.value
              : `${m.raceReadiness.value}%`
          }
          sub={m.raceReadiness.delta}
          href="/athlete/progress"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_280px]">
        <main className="min-w-0 space-y-8">
          <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={eyebrowClass}>Next session</p>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{next.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {next.dateLabel ?? next.day} · {next.duration} · RPE {next.rpeTarget}
                </p>
                <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs ${sessionTypeStyle(next.type)}`}>
                  {next.priority === "Optional" ? "Optional" : "Key session"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <BtnPrimary
                  disabled={!("actionable" in next) || !next.actionable || !next.sessionId}
                  onClick={() => next.sessionId && openSession(next.sessionId, next.name)}
                >
                  <Play className="h-4 w-4" />
                  View session
                </BtnPrimary>
                <BtnLinkSecondary href="/athlete/programme">Full week</BtnLinkSecondary>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">{next.objective}</p>
          </div>

          <div className={`${athleteCard} ${athleteCardPadding}`}>
            <p className={eyebrowClass}>{weekRationale.weekRole}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{weekRationale.whyMatters}</p>
            <p className="mt-3 text-xs text-zinc-500">
              Block {a.blockId} · {block.name} · Week {a.currentWeek}/{a.totalWeeks}
            </p>
          </div>

          {useLive && dashboardLive ? (
            <HyroxThisWeekTrackingCard
              live={dashboardLive.weekTracking}
              benchmarks={dashboardLive.benchmarkSnapshot}
              benchmarksLoading={dashboardLive.benchmarksLoading}
              benchmarksError={dashboardLive.benchmarksError}
              onCompleteCheckIn={() => router.push("/athlete/check-in")}
            />
          ) : null}

          {upcoming.length > 0 ? (
            <SnapshotPanel title="Still this week" href="/athlete/programme">
              <ul className="space-y-2">
                {upcoming.map((s) => (
                  <li
                    key={s.id}
                    className="list-none rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3 transition hover:border-zinc-700"
                  >
                    <p className="text-xs font-medium text-yellow-400/80">{s.dateLabel ?? s.day}</p>
                    <p className="font-medium text-white">{s.name}</p>
                  </li>
                ))}
              </ul>
            </SnapshotPanel>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <SnapshotPanel title="Progress snapshot" href="/athlete/progress" linkLabel="Full progress →">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Race readiness</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {useLive && dashboardLive?.raceReadiness.awaiting
                      ? dashboardLive.raceReadiness.value
                      : `${m.raceReadiness.value}%`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Consistency</p>
                  <p className="text-2xl font-bold text-white">{m.consistency.value}%</p>
                </div>
              </div>
              <div className="mt-4 h-36">
                {useLive && dashboardLive && !dashboardLive.chartsAvailable ? (
                  <ChartDataPlaceholder className="h-full" />
                ) : (
                  <ThresholdProgressionChart />
                )}
              </div>
            </SnapshotPanel>

            <div className="space-y-4">
              <SnapshotPanel title="Benchmarks" href="/athlete/benchmarks" linkLabel="All tests →">
                {useLive && benchmarksLoading ? (
                  <p className="text-sm text-zinc-500">Loading benchmark results…</p>
                ) : useLive && benchmarksError ? (
                  <p className="text-sm text-amber-300/90">{benchmarksError}</p>
                ) : useLive && benchmarkItems.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No tests logged yet.{" "}
                    <a href="/athlete/testing" className="font-semibold text-yellow-400 hover:underline">
                      Submit tests
                    </a>
                  </p>
                ) : (
                  <BenchmarkSnapshotStrip
                    items={benchmarkItems}
                    compact
                    testingHref="/athlete/testing"
                  />
                )}
              </SnapshotPanel>

              <SnapshotPanel
                title="Check-in"
                href="/athlete/check-in"
                linkLabel={checkInDue ? "Complete now →" : "Open →"}
                highlight={checkInDue}
              >
                <div className="flex items-center gap-2">
                  <StatusBadge tone={checkInDue ? "warn" : "neutral"}>{checkInStatus}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{checkInSub}</p>
                {checkInDue ? (
                  <Link
                    href="/athlete/check-in"
                    className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-yellow-400 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 sm:w-auto sm:px-5"
                  >
                    Complete check-in
                  </Link>
                ) : null}
              </SnapshotPanel>

              <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
                <p className={eyebrowClass}>Coach note</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">{coachFocus}</p>
                <LinkCta href="/athlete/coach-notes" className="mt-3 text-xs">
                  Read more →
                </LinkCta>
              </div>
            </div>
          </div>

          <section>
            <SectionTitle title="Explore" description="Full detail on each area of your training" />
            <div className="grid gap-3 sm:grid-cols-2">
              <HubLinkCard
                href="/athlete/programme"
                title="Programme"
                description="Full weekly schedule, session detail and logging"
                icon={CalendarDays}
                meta={`${stats.sessionsCompleted}/${stats.sessionsPlanned} sessions`}
              />
              <HubLinkCard
                href="/athlete/progress"
                title="Progress"
                description="Training load, charts and coach interpretation"
                icon={Activity}
                meta={`${stats.weeklyCompletionPct}% weekly completion`}
              />
              <HubLinkCard
                href="/athlete/benchmarks"
                title="Benchmarks"
                description="Hyrox tests, targets and improvement trends"
                icon={BarChart3}
                meta="8 tests tracked"
              />
              <HubLinkCard
                href="/athlete/check-in"
                title="Check-In"
                description="Recovery, load and availability for your coach"
                icon={ClipboardCheck}
                meta={checkInStatus}
              />
              <HubLinkCard
                href="/athlete/coach-notes"
                title="Coach Notes"
                description="Focus, adjustments and block rationale"
                icon={MessageSquare}
              />
              <HubLinkCard
                href="/athlete/race-prep"
                title="Race Prep"
                description="Pacing, fuelling, taper and race-day checklist"
                icon={Flag}
                meta="Unlocks Week 8"
              />
              <HubLinkCard
                href="/athlete/resources"
                title="Resources"
                description="Technique guides and race-week protocols"
                icon={BookOpen}
              />
            </div>
          </section>
        </main>

        <HomeStickyActions
          onViewSession={() => openSession(next.sessionId, next.name)}
          onLogResult={() => openSession(next.sessionId, next.name, { showLogForm: true })}
        />
      </div>

      <SessionDrawer
        sessionId={sessionId}
        session={drawerSession}
        sessionTitle={sessionTitle}
        sessionDetail={sessionDetailOverride}
        loggingEnabled={useLive && !useMockData}
        useLiveApi={useLive && !useMockData}
        initialShowLogForm={drawerShowLogForm}
        onSessionUpdated={(updated) => void handleSessionUpdated(updated)}
        onClose={() => {
          setSessionId(null);
          setDrawerSession(null);
          setDrawerShowLogForm(false);
          setSessionDetailOverride(null);
        }}
      />
    </PageContent>
  );
}
