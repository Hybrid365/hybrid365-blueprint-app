"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import {
  COMMUNITY_PROGRAMME_BEING_BUILT_BODY,
  COMMUNITY_PROGRAMME_BEING_BUILT_EMAIL_NOTE,
  COMMUNITY_PROGRAMME_BEING_BUILT_TITLE,
  COMMUNITY_ASSESSMENT_SUBMITTED_HEADLINE,
} from "@/components/dashboard/communityOnboardingCopy";
import {
  formatUnlockCountdown,
  formatUnlockDateTime,
} from "@/app/lib/communityProgrammeUnlock";

type Props = {
  variant?: "default" | "compact";
  unlockAtMs?: number | null;
  showAssessmentSubmitted?: boolean;
};

export function ProgrammeBeingBuiltCard({
  variant = "default",
  unlockAtMs = null,
  showAssessmentSubmitted = true,
}: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!unlockAtMs || unlockAtMs <= Date.now()) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [unlockAtMs]);

  const countdown =
    unlockAtMs && unlockAtMs > nowMs
      ? formatUnlockCountdown(unlockAtMs, nowMs)
      : null;
  const estimated =
    unlockAtMs && unlockAtMs > nowMs ? formatUnlockDateTime(unlockAtMs) : null;

  const compact = variant === "compact";

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-950 to-black shadow-lg shadow-black/30 ${
        compact ? "p-5 sm:p-6" : "p-6 sm:p-10"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(250,204,21,0.12),transparent)]" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/30">
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="min-w-0 flex-1">
            {showAssessmentSubmitted ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
                Assessment submitted
              </p>
            ) : null}
            <h2
              className={`font-bold text-white ${compact ? "mt-1 text-xl" : "mt-2 text-2xl sm:text-3xl"}`}
            >
              {showAssessmentSubmitted && !compact
                ? COMMUNITY_ASSESSMENT_SUBMITTED_HEADLINE
                : COMMUNITY_PROGRAMME_BEING_BUILT_TITLE}
            </h2>
            {!compact && showAssessmentSubmitted ? (
              <p className="mt-2 text-sm font-medium text-yellow-200/90">
                {COMMUNITY_PROGRAMME_BEING_BUILT_TITLE}
              </p>
            ) : null}
          </div>
        </div>

        <p className={`leading-relaxed text-zinc-300 ${compact ? "mt-4 text-sm" : "mt-5 text-sm sm:text-base"}`}>
          {COMMUNITY_PROGRAMME_BEING_BUILT_BODY}
        </p>
        <p className={`text-zinc-400 ${compact ? "mt-3 text-sm" : "mt-4 text-sm"}`}>
          Your first block will unlock within 12 hours.
        </p>
        <p className={`text-zinc-500 ${compact ? "mt-2 text-xs" : "mt-3 text-sm"}`}>
          {COMMUNITY_PROGRAMME_BEING_BUILT_EMAIL_NOTE}
        </p>

        {countdown || estimated ? (
          <div
            className={`flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 ${
              compact ? "mt-4 px-3 py-2.5" : "mt-6 px-4 py-3"
            }`}
          >
            <Clock className="h-4 w-4 shrink-0 text-yellow-400/80" />
            <div className="text-sm">
              {countdown ? <p className="font-semibold text-yellow-200/95">{countdown}</p> : null}
              {estimated ? (
                <p className="text-zinc-400">Estimated unlock: {estimated}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
