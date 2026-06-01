"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Lock, Trophy, Zap } from "lucide-react";
import Hybrid75SessionLogModal from "@/components/free-week/Hybrid75SessionLogModal";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75ChallengeLogs } from "@/components/free-week/useHybrid75ChallengeLogs";
import {
  findHybridHardChallengeSession,
  HYBRID75_WEEKLY_CHALLENGES,
  type Hybrid75WeeklyChallengeDefinition,
} from "@/app/lib/hybrid75WeeklyChallenges";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
} from "@/app/lib/freeWeekChallengeMode";
import {
  isHybrid75LoggableSession,
  logDisplayMessage,
  type Hybrid75ChallengeSessionLog,
} from "@/app/lib/hybrid75ChallengeLogging";
import { parseFreePlanSchedule, sortSessionsByDay } from "@/app/lib/freePlanDashboard";

function ChallengeCardShell({
  children,
  active = false,
  locked = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  locked?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 md:p-7 ${
        active
          ? "border-[#F4D23C]/40 bg-gradient-to-br from-[#F4D23C]/8 via-zinc-950 to-black shadow-[0_0_40px_rgba(244,210,60,0.08)]"
          : locked
            ? "border-zinc-800/80 bg-zinc-950/50 opacity-80"
            : "border-zinc-800 bg-zinc-900/80"
      }`}
    >
      {children}
    </article>
  );
}

function ActiveChallengeCard({
  challenge,
  onLogChallenge,
  planId,
  logStatus,
}: {
  challenge: Hybrid75WeeklyChallengeDefinition;
  onLogChallenge: () => void;
  planId: string;
  logStatus: ReturnType<typeof logDisplayMessage> | null;
}) {
  return (
    <ChallengeCardShell active>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="inline-flex rounded-full border border-[#F4D23C]/40 bg-[#F4D23C]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F4D23C]">
          {challenge.badge}
        </span>
        <Zap className="h-6 w-6 text-[#F4D23C]" />
      </div>

      <h2 className="mt-4 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
        {challenge.title}
      </h2>

      {challenge.workoutIntro ? (
        <p className="mt-5 text-sm font-semibold text-white/90">{challenge.workoutIntro}</p>
      ) : null}

      {challenge.movements?.length ? (
        <ul className="mt-3 space-y-2">
          {challenge.movements.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-zinc-200">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F4D23C]" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {challenge.scoreLabel ? (
        <p className="mt-4 text-sm font-semibold text-[#F4D23C]">{challenge.scoreLabel}</p>
      ) : null}

      {challenge.rules?.length ? (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rules</p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-400">
            {challenge.rules.map((rule) => (
              <li key={rule}>· {rule}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {challenge.points?.length ? (
        <div className="mt-6 rounded-2xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F4D23C]">Points</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {challenge.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {challenge.proofCopy ? (
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">{challenge.proofCopy}</p>
      ) : null}

      {challenge.postFormat?.length ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Post format</p>
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-zinc-400">
            {challenge.postFormat.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {logStatus ? (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
          <p className="text-sm font-semibold text-white">{logStatus.headline}</p>
          {logStatus.pointsLine ? (
            <p
              className={`mt-1 text-sm ${
                logStatus.proofRequired ? "text-amber-300" : "text-[#F4D23C]"
              }`}
            >
              {logStatus.pointsLine}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onLogChallenge}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
        >
          Log Challenge
        </button>
        <a
          href={FREE_WEEK_TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#F4D23C]/40"
        >
          {HYBRID75_TELEGRAM_GROUP_LABEL}
          <ExternalLink className="h-4 w-4 opacity-70" />
        </a>
        <Link
          href={`/plan/${planId}/leaderboard`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#F4D23C]/40"
        >
          <Trophy className="h-4 w-4 text-[#F4D23C]" />
          View Leaderboard
        </Link>
      </div>
    </ChallengeCardShell>
  );
}

function ComingSoonChallengeCard({ challenge }: { challenge: Hybrid75WeeklyChallengeDefinition }) {
  return (
    <ChallengeCardShell locked>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          <Lock className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {challenge.badge}
          </span>
          <h3 className="mt-1 text-lg font-bold text-zinc-400">{challenge.title}</h3>
          <p className="mt-2 text-sm text-zinc-600">{challenge.comingSoonCopy}</p>
        </div>
      </div>
    </ChallengeCardShell>
  );
}

export default function Hybrid75ChallengeClient() {
  const { planId, planJson, athleteEmail, athleteName } = useFreePlan();
  const challengeLogs = useHybrid75ChallengeLogs(planId, true);
  const [logModalOpen, setLogModalOpen] = useState(false);

  const sessions = useMemo(
    () => sortSessionsByDay(parseFreePlanSchedule(Array.isArray(planJson.schedule) ? planJson.schedule : [])),
    [planJson.schedule]
  );

  const challengeSession = useMemo(() => findHybridHardChallengeSession(sessions), [sessions]);

  const existingLog = challengeSession
    ? (challengeLogs.logsBySessionId[challengeSession.scrollId] as
        | Hybrid75ChallengeSessionLog
        | undefined)
    : null;

  const displayStatus = existingLog ? logDisplayMessage(existingLog) : null;

  const handleSaveLog = useCallback(
    async (payload: Record<string, unknown>) => {
      await challengeLogs.saveLog(payload);
    },
    [challengeLogs]
  );

  const handleLogChallenge = useCallback(() => {
    if (challengeSession && isHybrid75LoggableSession(challengeSession)) {
      setLogModalOpen(true);
      return;
    }
    window.location.href = `/plan/${planId}/week${challengeSession ? `#${challengeSession.scrollId}` : ""}`;
  }, [challengeSession, planId]);

  const active = HYBRID75_WEEKLY_CHALLENGES.filter((w) => w.status === "active");
  const comingSoon = HYBRID75_WEEKLY_CHALLENGES.filter((w) => w.status === "coming_soon");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4D23C]">Hybrid 75</p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Weekly Hybrid Hard Challenge</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Each week, you&apos;ll get a Hybrid Hard Challenge to test yourself, post proof, log your score and
          climb the leaderboard.
        </p>
      </div>

      {!challengeLogs.configured ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Session logging storage is not configured in this environment yet.
        </p>
      ) : null}

      <div className="space-y-4">
        {active.map((week) => (
          <ActiveChallengeCard
            key={week.weekNumber}
            challenge={week}
            planId={planId}
            onLogChallenge={handleLogChallenge}
            logStatus={displayStatus ?? null}
          />
        ))}
        {comingSoon.map((week) => (
          <ComingSoonChallengeCard key={week.weekNumber} challenge={week} />
        ))}
      </div>

      <Hybrid75SessionLogModal
        open={logModalOpen && Boolean(challengeSession)}
        session={challengeSession ?? null}
        planId={planId}
        athleteName={athleteName}
        athleteEmail={athleteEmail}
        existingLog={existingLog ?? null}
        saving={challengeLogs.saving}
        onClose={() => setLogModalOpen(false)}
        onSave={handleSaveLog}
      />
    </div>
  );
}
