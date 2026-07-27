"use client";

import { useCallback, useMemo } from "react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import {
  resolveNextScheduledSession,
  resolveSessionCtaState,
  resolveTodaysSessions,
  type SessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { TodayMissionCard } from "../today/TodayMissionCard";
import { athleteCardHighlight } from "../athleteUi";

type Props = {
  weekSessions: HyroxSession[];
  programmeStartDate: string | null;
  globalWeekNumber: number;
  programmeWeeks?: Array<{ weekNumber: number; sessions: HyroxSession[] }>;
  coachFocus?: string;
  timezone?: string;
  readOnly?: boolean;
  onOpenSession: (session: HyroxSession, opts?: { showLogForm?: boolean }) => void;
};

export function HomeMissionSection({
  weekSessions,
  programmeStartDate,
  globalWeekNumber,
  programmeWeeks,
  coachFocus,
  timezone,
  readOnly,
  onOpenSession,
}: Props) {
  const todayYmd = timezone
    ? localDateYmdInTimeZone(new Date(), timezone)
    : undefined;

  const todays = useMemo(
    () =>
      resolveTodaysSessions({
        programmeStartDate,
        globalWeekNumber,
        sessions: weekSessions,
        todayYmd,
      }),
    [programmeStartDate, globalWeekNumber, weekSessions, todayYmd]
  );

  const nextSession = useMemo(() => {
    if (todays.length) return null;
    return resolveNextScheduledSession({
      programmeStartDate,
      sessionsByWeek: programmeWeeks?.length
        ? programmeWeeks
        : [{ weekNumber: globalWeekNumber, sessions: weekSessions }],
      todayYmd,
    });
  }, [todays.length, programmeStartDate, programmeWeeks, globalWeekNumber, weekSessions, todayYmd]);

  const handlePrimary = useCallback(
    (session: HyroxSession, cta: SessionCtaState) => {
      const showLog =
        cta === "continue_logging" ||
        cta === "log_partial" ||
        cta === "view_result";
      onOpenSession(session, { showLogForm: showLog });
    },
    [onOpenSession]
  );

  const primaryIndex = todays.findIndex((s) => {
    const state = resolveSessionCtaState(s);
    return state === "start" || state === "continue_logging" || state === "log_partial";
  });
  const activePrimary = primaryIndex >= 0 ? primaryIndex : 0;

  if (todays.length > 0) {
    return (
      <section aria-label="Today's mission" className="space-y-4">
        {todays.map((session, i) => (
          <TodayMissionCard
            key={session.id}
            session={session}
            sessionIndex={i}
            sessionCount={todays.length}
            detail={sessionDetailFromHyroxSession(session)}
            isPrimary={i === activePrimary}
            disabled={readOnly}
            sectionLabel={
              todays.length > 1
                ? `Session ${i + 1} of ${todays.length}`
                : "Today's mission"
            }
            onPrimaryAction={handlePrimary}
          />
        ))}
      </section>
    );
  }

  if (nextSession) {
    return (
      <section aria-label="Next key session">
        <TodayMissionCard
          session={nextSession}
          sessionIndex={0}
          sessionCount={1}
          detail={sessionDetailFromHyroxSession(nextSession)}
          isPrimary
          disabled={readOnly}
          sectionLabel="Next key session"
          missionVariant="next"
          onPrimaryAction={handlePrimary}
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Recovery day"
      className={`${athleteCardHighlight} p-5 sm:p-6`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
        Recovery day
      </p>
      <h2 className="mt-1 text-2xl font-bold text-white">No session prescribed today</h2>
      {coachFocus?.trim() ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{coachFocus}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">
          Use today for recovery as your coach has programmed.
        </p>
      )}
    </section>
  );
}
