"use client";

import { useCallback, useMemo, useState } from "react";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { sessionDetailFromHyroxSession } from "@/app/lib/hyroxAthleteDashboardLive";
import { buildTodayChecklist } from "@/app/lib/hyrox-team/modules/today/checklist";
import {
  resolveNextScheduledSession,
  resolveSessionCtaState,
  resolveTodaysSessions,
  type SessionCtaState,
} from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { DailyReadinessInputs } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import {
  acknowledgeHyroxCoachNoteTodayAction,
  fetchHyroxDailyReadinessAction,
  saveHyroxDailyReadinessAction,
} from "@/app/lib/hyroxDailyReadinessAction";
import { localDateYmdInTimeZone } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { useAthletePortalOptional } from "../athletePortalContext";
import { useAthleteAdminPreview } from "../athletePortalAdminPreview";
import { TodayMissionCard } from "./TodayMissionCard";
import { TodayReadinessCard } from "./TodayReadinessCard";
import { TodayChecklist } from "./TodayChecklist";

type Props = {
  weekSessions: HyroxSession[];
  programmeStartDate: string | null;
  globalWeekNumber: number;
  programmeWeeks?: Array<{ weekNumber: number; sessions: HyroxSession[] }>;
  coachFocus?: string;
  readOnly?: boolean;
  onOpenSession: (session: HyroxSession, opts?: { showLogForm?: boolean }) => void;
};

export function TodayExperience({
  weekSessions,
  programmeStartDate,
  globalWeekNumber,
  programmeWeeks,
  coachFocus,
  readOnly,
  onOpenSession,
}: Props) {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const athleteId =
    adminPreview?.portalAthlete.id ?? portal?.portalAthlete?.id ?? null;
  const timezone =
    adminPreview?.athleteTimezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const [readiness, setReadiness] = useState<HyroxDailyReadinessRow | null>(
    adminPreview?.initialReadiness ?? null
  );
  const [saving, setSaving] = useState(false);
  const [ackSaving, setAckSaving] = useState(false);
  const [readinessKey, setReadinessKey] = useState<string | null>(null);

  const todays = useMemo(
    () =>
      resolveTodaysSessions({
        programmeStartDate,
        globalWeekNumber,
        sessions: weekSessions,
        todayYmd: adminPreview
          ? localDateYmdInTimeZone(new Date(), timezone)
          : undefined,
      }),
    [programmeStartDate, globalWeekNumber, weekSessions, adminPreview, timezone]
  );

  const nextSession = useMemo(() => {
    if (todays.length) return null;
    return resolveNextScheduledSession({
      programmeStartDate,
      sessionsByWeek: programmeWeeks?.length
        ? programmeWeeks
        : [{ weekNumber: globalWeekNumber, sessions: weekSessions }],
      todayYmd: adminPreview
        ? localDateYmdInTimeZone(new Date(), timezone)
        : undefined,
    });
  }, [
    todays.length,
    programmeStartDate,
    programmeWeeks,
    globalWeekNumber,
    weekSessions,
    adminPreview,
    timezone,
  ]);

  const loadKey = `${athleteId ?? "none"}:${readOnly ? "ro" : "rw"}:${timezone}`;
  if (athleteId && readinessKey !== loadKey) {
    setReadinessKey(loadKey);
    if (adminPreview) {
      if (adminPreview.initialReadiness) {
        setReadiness(adminPreview.initialReadiness);
      } else {
        void fetch(
          `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/today-snapshot?timezone=${encodeURIComponent(timezone)}&includeReadiness=1`,
          { credentials: "include" }
        )
          .then((res) => res.json())
          .then((json: { success?: boolean; readiness?: HyroxDailyReadinessRow | null }) => {
            if (json.success) setReadiness(json.readiness ?? null);
          })
          .catch(() => {
            /* keep null */
          });
      }
    } else if (!readOnly) {
      void fetchHyroxDailyReadinessAction({
        expectedAthleteId: athleteId,
        timezone,
      }).then((res) => {
        if (res.success) setReadiness(res.readiness ?? null);
      });
    }
  }
  const checklist = useMemo(
    () =>
      buildTodayChecklist({
        readinessSubmitted: Boolean(readiness?.submitted_at),
        todaysSessions: todays,
        coachNoteReviewed: Boolean(readiness?.coach_note_reviewed_at),
        hasCoachNote: Boolean(coachFocus?.trim()),
      }),
    [readiness, todays, coachFocus]
  );

  const handleSubmitReadiness = useCallback(
    async (input: DailyReadinessInputs & { timezone: string }) => {
      if (!athleteId || readOnly) return false;
      setSaving(true);
      try {
        const res = await saveHyroxDailyReadinessAction({
          ...input,
          expectedAthleteId: athleteId,
        });
        if (res.success && res.readiness) {
          setReadiness(res.readiness);
          return true;
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [athleteId, readOnly]
  );

  const handleAckCoachNote = useCallback(async () => {
    if (!athleteId || readOnly) return;
    setAckSaving(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const res = await acknowledgeHyroxCoachNoteTodayAction({
        expectedAthleteId: athleteId,
        timezone,
      });
      if (res.success && res.readiness) setReadiness(res.readiness);
    } finally {
      setAckSaving(false);
    }
  }, [athleteId, readOnly]);

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

  return (
    <div className="space-y-5">
      <TodayReadinessCard
        readiness={readiness}
        saving={saving}
        disabled={readOnly}
        onSubmit={handleSubmitReadiness}
      />

      <TodayChecklist
        items={checklist}
        onAcknowledgeCoachNote={
          readOnly || !coachFocus?.trim() ? undefined : () => void handleAckCoachNote()
        }
        acknowledging={ackSaving}
      />

      {todays.length === 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
            Recovery day
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">No session prescribed today</h2>
          {coachFocus?.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{coachFocus}</p>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">
              Use today for recovery as your coach has programmed. Submit readiness so they can see
              how you&apos;re feeling.
            </p>
          )}
          {nextSession ? (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Next scheduled session
              </p>
              <p className="mt-1 font-semibold text-white">{nextSession.name}</p>
              <p className="text-sm text-zinc-500">
                {nextSession.dateLabel ?? nextSession.day}
                {nextSession.duration ? ` · ${nextSession.duration}` : ""}
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="space-y-4">
          {todays.map((session, i) => (
            <TodayMissionCard
              key={session.id}
              session={session}
              sessionIndex={i}
              sessionCount={todays.length}
              detail={sessionDetailFromHyroxSession(session)}
              isPrimary={i === activePrimary}
              disabled={readOnly}
              onPrimaryAction={handlePrimary}
            />
          ))}
        </div>
      )}

      {readiness?.submitted_at ? (
        <p className="text-center text-xs text-zinc-500">
          Your coach can now review today&apos;s readiness and session feedback.
        </p>
      ) : null}
    </div>
  );
}
