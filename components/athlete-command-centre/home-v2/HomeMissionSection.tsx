"use client";

import { useCallback, useMemo } from "react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import { resolveNextScheduledSession, resolveTodaysSessions, type SessionCtaState } from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { HomeCompactSessionCard } from "./HomeCompactSessionCard";
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

  if (todays.length > 0) {
    return (
      <section aria-label="Today's session" className="space-y-2">
        {todays.map((session, i) => (
          <HomeCompactSessionCard
            key={session.id}
            session={session}
            sessionIndex={i}
            sessionCount={todays.length}
            detail={sessionDetailFromHyroxSession(session)}
            sectionLabel={todays.length > 1 ? "Today's session" : "Today's session"}
            disabled={readOnly}
            onPrimaryAction={handlePrimary}
          />
        ))}
      </section>
    );
  }

  if (nextSession) {
    return (
      <section aria-label="Next key session">
        <HomeCompactSessionCard
          session={nextSession}
          detail={sessionDetailFromHyroxSession(nextSession)}
          sectionLabel="Next key session"
          missionVariant="next"
          disabled={readOnly}
          onPrimaryAction={handlePrimary}
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Recovery day"
      className={`${athleteCardHighlight} p-4`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400/90">
        Recovery day
      </p>
      <h2 className="mt-1 text-lg font-bold text-white">No session prescribed today</h2>
      {coachFocus?.trim() ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">{coachFocus}</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Use today for recovery as your coach has programmed.
        </p>
      )}
    </section>
  );
}
