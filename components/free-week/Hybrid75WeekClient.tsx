"use client";

import { useCallback, useMemo, useState } from "react";
import { FreePlanSessionCard } from "@/components/free-week/FreePlanSessionCard";
import Hybrid75SessionLogModal from "@/components/free-week/Hybrid75SessionLogModal";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75ChallengeLogs } from "@/components/free-week/useHybrid75ChallengeLogs";
import {
  isHybrid75LoggableSession,
  type Hybrid75ChallengeSessionLog,
} from "@/app/lib/hybrid75ChallengeLogging";
import { parseFreePlanSchedule, sortSessionsByDay, type FreePlanSession } from "@/app/lib/freePlanDashboard";

export default function Hybrid75WeekClient() {
  const { planId, planJson, athleteEmail, athleteName } = useFreePlan();
  const challengeLogs = useHybrid75ChallengeLogs(planId, true);
  const [logModalSession, setLogModalSession] = useState<FreePlanSession | null>(null);

  const sessions = useMemo(
    () => sortSessionsByDay(parseFreePlanSchedule(Array.isArray(planJson.schedule) ? planJson.schedule : [])),
    [planJson.schedule]
  );

  const handleSaveLog = useCallback(
    async (payload: Record<string, unknown>) => {
      await challengeLogs.saveLog(payload);
    },
    [challengeLogs]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">This week&apos;s schedule</h1>
        <p className="mt-2 text-zinc-400">Tap through each session — log with proof when complete.</p>
      </div>

      <div>
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-yellow-300">Quick note from Kieran</p>
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <iframe
            src="https://www.youtube.com/embed/dMOMVcctNns"
            title="Hybrid365 Coaching Intro"
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {!challengeLogs.configured ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Session logging storage is not configured in this environment yet.
        </p>
      ) : null}

      <div className="space-y-4">
        {sessions.map((day) => (
          <FreePlanSessionCard
            key={day.scrollId}
            session={day}
            isHybrid75
            allSessions={sessions}
            sessionLog={challengeLogs.logsBySessionId[day.scrollId]}
            challengeTabHref={`/plan/${planId}/challenge`}
            onLogSession={
              isHybrid75LoggableSession(day) ? () => setLogModalSession(day) : undefined
            }
          />
        ))}
      </div>

      <Hybrid75SessionLogModal
        open={Boolean(logModalSession)}
        session={logModalSession}
        planId={planId}
        athleteName={athleteName}
        athleteEmail={athleteEmail}
        existingLog={
          logModalSession
            ? (challengeLogs.logsBySessionId[logModalSession.scrollId] as Hybrid75ChallengeSessionLog | undefined)
            : null
        }
        saving={challengeLogs.saving}
        onClose={() => setLogModalSession(null)}
        onSave={handleSaveLog}
      />
    </div>
  );
}
