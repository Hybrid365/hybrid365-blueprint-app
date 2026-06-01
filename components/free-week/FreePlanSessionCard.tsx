"use client";

import { ClipboardList } from "lucide-react";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
} from "@/app/lib/freeWeekChallengeMode";
import {
  getChallengeFocusLabel,
  type FreePlanSession,
} from "@/app/lib/freePlanDashboard";
import {
  logDisplayMessage,
  type Hybrid75ChallengeSessionLog,
} from "@/app/lib/hybrid75ChallengeLogging";

function renderList(items?: string[]) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2 text-zinc-300">
      {items.map((item, i) => (
        <li key={i} className="leading-7">
          <span className="text-yellow-400">-</span> {item}
        </li>
      ))}
    </ul>
  );
}

export function FreePlanSessionCard({
  session,
  isHybrid75,
  allSessions,
  sessionLog,
  onLogSession,
}: {
  session: FreePlanSession;
  isHybrid75: boolean;
  allSessions: FreePlanSession[];
  sessionLog?: Hybrid75ChallengeSessionLog;
  onLogSession?: () => void;
}) {
  const isChallenge = session.category === "Challenge";
  const focusLabel = isHybrid75 ? getChallengeFocusLabel(session, allSessions) : null;
  const logStatus = sessionLog ? logDisplayMessage(sessionLog) : null;

  return (
    <div
      id={session.scrollId}
      className={`scroll-mt-24 rounded-3xl border p-5 md:p-7 ${
        isChallenge ? "border-yellow-400/40 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950/85"
      }`}
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-400">{session.day}</p>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
              {session.category}
            </span>
            {focusLabel ? (
              <span className="rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 px-2 py-0.5 text-xs text-[#F4D23C]">
                {focusLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-2xl font-bold text-white md:text-3xl">{session.title}</h3>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-300">{session.intent}</p>
        </div>
        {session.timeCapMinutes ? (
          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Time cap: <span className="font-semibold text-white">{session.timeCapMinutes} min</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {session.session.warm_up?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="mb-3 font-semibold text-white">Warm-up</h4>
            {renderList(session.session.warm_up)}
          </div>
        ) : null}
        {session.session.main?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:col-span-2">
            <h4 className="mb-3 font-semibold text-white">Main Work</h4>
            {renderList(session.session.main)}
          </div>
        ) : null}
        {session.session.cool_down?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="mb-3 font-semibold text-white">Cool-down</h4>
            {renderList(session.session.cool_down)}
          </div>
        ) : null}
        {session.session.finish?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="mb-3 font-semibold text-white">Finish</h4>
            {renderList(session.session.finish)}
          </div>
        ) : null}
        {session.session.notes?.length ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:col-span-2">
            <h4 className="mb-3 font-semibold text-white">Coaching Notes</h4>
            {renderList(session.session.notes)}
          </div>
        ) : null}
      </div>

      {session.challengeCta ? (
        <a
          href={FREE_WEEK_TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          {HYBRID75_TELEGRAM_GROUP_LABEL}
        </a>
      ) : null}

      {onLogSession ? (
        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {logStatus ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-zinc-400">Log this session after you complete it and post proof.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onLogSession}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-5 py-2.5 text-sm font-semibold text-[#F4D23C] transition hover:bg-[#F4D23C]/15"
          >
            <ClipboardList className="h-4 w-4" />
            Log Session
          </button>
        </div>
      ) : null}
    </div>
  );
}
