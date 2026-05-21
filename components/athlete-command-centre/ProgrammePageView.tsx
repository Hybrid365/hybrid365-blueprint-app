"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
} from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  SectionTitle,
  ProgressBar,
  eyebrowClass,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
} from "./athleteUi";
import { SessionDrawer } from "./SessionDrawer";
import { WeekSessionCard } from "./WeekSessionCard";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { useAthletePortal } from "./athletePortalContext";

type WeekTabMode = "active" | "upcoming" | "past" | "not_generated";

type WeekTab = {
  label: string;
  subtitle: string;
  globalWeek: number;
  mode: WeekTabMode;
  generated: boolean;
};

const FUTURE_WEEK_NOTE =
  "Future weeks are subject to change based on check-ins and coach review.";

export function ProgrammePageView() {
  const {
    programmePublishedLive,
    liveProgramme,
    liveProgrammeLoading,
    portalAthlete,
    useMockPreview,
    programmeHubLive,
  } = useAthletePortal();
  const { dashboardLive } = useAthleteDashboardLive();
  const useLive = programmePublishedLive && !useMockPreview;
  const useMock = useMockPreview;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [sessionDetailOverride, setSessionDetailOverride] = useState<
    ReturnType<typeof sessionDetailFromHyroxSession> | null
  >(null);

  const blockId = useLive && dashboardLive ? dashboardLive.blockId : MOCK_ATHLETE.blockId;
  const block = HYROX_BLOCKS.find((b) => b.id === blockId)!;
  const currentWeek = useLive && liveProgramme ? liveProgramme.athlete.current_week : MOCK_ATHLETE.currentWeek;

  const weekTabs: WeekTab[] = useMemo(() => {
    return block.weeks.map((globalWeek, i) => {
      const cycle = (i + 1) as 1 | 2 | 3 | 4;
      const bundle = useLive
        ? liveProgramme?.programmeWeeks?.find((b) => b.weekNumber === globalWeek)
        : null;
      const generated = Boolean(bundle?.generated && bundle.sessions.length > 0);
      const subtitle = BLOCK_WEEK_FOCUS_LABELS[cycle];

      let mode: WeekTabMode = "not_generated";
      if (generated) {
        if (globalWeek === currentWeek) mode = "active";
        else if (globalWeek < currentWeek) mode = "past";
        else mode = "upcoming";
      }

      return {
        label: `W${cycle}`,
        subtitle,
        globalWeek,
        mode,
        generated,
      };
    });
  }, [block.weeks, useLive, liveProgramme?.programmeWeeks, currentWeek]);

  const defaultTab =
    weekTabs.find((t) => t.mode === "active")?.globalWeek ??
    weekTabs.find((t) => t.generated)?.globalWeek ??
    weekTabs[0]?.globalWeek ??
    1;
  const [selectedWeek, setSelectedWeek] = useState(defaultTab);

  useEffect(() => {
    setSelectedWeek(defaultTab);
  }, [defaultTab]);

  const selectedTab = weekTabs.find((t) => t.globalWeek === selectedWeek) ?? weekTabs[0];
  const selectedBundle = useLive
    ? liveProgramme?.programmeWeeks?.find((b) => b.weekNumber === selectedWeek)
    : null;

  const sessions = useLive && selectedBundle?.generated
    ? selectedBundle.sessions
    : useMock
      ? MOCK_WEEK_SESSIONS
      : [];

  const rationale =
    useLive && selectedBundle?.weekRole
      ? {
          weekRole: selectedBundle.weekRole,
          whyMatters:
            selectedBundle.week?.athlete_facing_note ??
            liveProgramme?.weekRationale?.whyMatters ??
            "",
          prioritise: liveProgramme?.weekRationale?.prioritise ?? [],
          coachNote:
            selectedBundle.week?.coach_note ?? liveProgramme?.weekRationale?.coachNote ?? "",
        }
      : useLive && liveProgramme?.weekRationale
        ? liveProgramme.weekRationale
        : MOCK_WEEK_RATIONALE;

  const completed = sessions.filter((s) => s.status === "complete").length;
  const meta = ATHLETE_PAGE_META.programme;
  const athleteName =
    (useLive && liveProgramme?.athlete.name) || portalAthlete?.name || MOCK_ATHLETE.name;

  const openSession = useCallback(
    (id: string, title?: string) => {
      setSessionId(id);
      setSessionTitle(title);
      const session = sessions.find((s) => s.id === id);
      setSessionDetailOverride(session ? sessionDetailFromHyroxSession(session) : null);
    },
    [sessions]
  );

  const programmeVisible = programmeHubLive;
  const showMockWeek = useMock && !useLive;
  const showWeekSessions = (useLive && selectedTab?.generated) || showMockWeek;

  return (
    <PageContent width="wide">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={
          useLive
            ? `Block ${blockId} · Week ${currentWeek} · ${athleteName}`
            : `${meta.subtitle} · Week ${currentWeek} of ${MOCK_ATHLETE.totalWeeks}`
        }
      />

      {useLive ? (
        <p className="-mt-4 text-xs text-zinc-500">
          Your coach may adjust future weeks after check-ins. {FUTURE_WEEK_NOTE}
        </p>
      ) : null}

      {liveProgrammeLoading && useLive ? (
        <p className="text-sm text-zinc-500">Loading programme…</p>
      ) : null}

      <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
        <p className={eyebrowClass}>
          Block {blockId} · {block.name}
          {selectedTab ? ` · ${selectedTab.subtitle}` : ""}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{rationale.whyMatters}</p>
        {showWeekSessions ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-400">
              {completed} of {sessions.length} sessions complete
            </span>
            <ProgressBar
              value={sessions.length ? Math.round((completed / sessions.length) * 100) : 0}
              className="h-2 max-w-xs flex-1"
            />
          </div>
        ) : null}
        {rationale.prioritise?.length ? (
          <ul className="mt-4 space-y-1.5">
            {rationale.prioritise.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-zinc-400">
                <span className="text-yellow-400">›</span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 border-t border-zinc-800 pt-4 text-xs italic text-zinc-500">
          Coach: {rationale.coachNote}
        </p>
      </div>

      {programmeVisible ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekTabs.map((tab) => {
              const active = selectedWeek === tab.globalWeek;
              const chipLabel =
                tab.mode === "active"
                  ? "Live"
                  : tab.mode === "upcoming"
                    ? "Upcoming"
                    : tab.mode === "past"
                      ? "Past"
                      : "Not generated";
              return (
                <button
                  key={tab.globalWeek}
                  type="button"
                  onClick={() => setSelectedWeek(tab.globalWeek)}
                  className={`flex min-w-[100px] shrink-0 flex-col rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-yellow-400/50 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-sm font-bold text-white">{tab.label}</span>
                  <span className="text-[10px] text-zinc-500">{tab.subtitle}</span>
                  <span
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      tab.mode === "active"
                        ? "text-emerald-400"
                        : tab.generated
                          ? "text-yellow-400/80"
                          : "text-zinc-600"
                    }`}
                  >
                    {chipLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {showWeekSessions ? (
            <section>
              <SectionTitle
                title={`${selectedTab?.subtitle ?? "Week"} · Week ${selectedWeek}`}
                description={`${completed} of ${sessions.length} complete${
                  selectedTab?.mode === "upcoming" ? " · upcoming plan" : ""
                }`}
              />
              <div className="space-y-4">
                {sessions.map((session) => (
                  <WeekSessionCard
                    key={session.id}
                    session={session}
                    onView={() => openSession(session.id, session.name)}
                    onLog={useMock ? () => openSession(session.id, session.name) : undefined}
                  />
                ))}
              </div>
              {selectedTab?.mode === "upcoming" ? (
                <p className="mt-4 text-xs text-zinc-500">{FUTURE_WEEK_NOTE}</p>
              ) : null}
            </section>
          ) : (
            <div className={`${athleteCard} ${athleteCardPadding}`}>
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 text-zinc-500" />
                <div>
                  <p className={eyebrowClass}>Week not generated yet</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    Your coach has not published sessions for {selectedTab?.label ?? "this week"} (
                    {selectedTab?.subtitle}) yet. This is not a preview placeholder — the week will
                    appear here once generated and published.
                  </p>
                  {process.env.NODE_ENV === "development" ? (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
                      Dev: coach publish should use block publish (4 weeks). Re-publish from programme
                      builder to backfill weeks 2–4.
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-500">{FUTURE_WEEK_NOTE}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>Programme</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Your programme is being built. You&apos;ll see your first block here once your coach
            publishes it.
          </p>
        </div>
      )}

      <SessionDrawer
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        sessionDetail={sessionDetailOverride}
        onClose={() => {
          setSessionId(null);
          setSessionDetailOverride(null);
        }}
      />
    </PageContent>
  );
}
