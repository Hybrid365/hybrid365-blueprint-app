"use client";

import { sanitizeCoachInsightForAthlete } from "@/app/lib/hyrox-team/modules/home/coachInsightCopy";
import { AthletePortalNavLink } from "../AthletePortalNavLink";
import { athleteCardHighlight, eyebrowClass } from "../athleteUi";

type Props = {
  insight: string;
  focusTags?: string[];
  sourceHint?: string | null;
  readOnly?: boolean;
};

export function HomeCoachInsight({
  insight,
  focusTags = [],
  sourceHint,
  readOnly,
}: Props) {
  const { body, sourceHint: autoHint } = sanitizeCoachInsightForAthlete(insight);
  const hint = sourceHint ?? autoHint;
  const hasInsight = Boolean(body);
  const tags = focusTags.filter(Boolean).slice(0, 4);

  return (
    <section
      className={`${athleteCardHighlight} p-5 sm:p-6`}
      aria-label="Coach insight"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-500/25 bg-yellow-400/10 text-xs font-bold text-yellow-200"
          aria-hidden
        >
          H3
        </span>
        <div className="min-w-0 flex-1">
          <p className={eyebrowClass}>Coach insight</p>
          {hasInsight ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">&ldquo;{body}&rdquo;</p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              Your coach will share focus notes when your programme is live.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400">Hybrid365 Coach</span>
            {hint ? <span>· {hint}</span> : null}
          </div>
          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {!readOnly ? (
            <AthletePortalNavLink
              href="/athlete/coach-notes"
              className="mt-4 inline-block text-xs font-semibold text-yellow-400 hover:text-yellow-300"
            >
              View coach notes →
            </AthletePortalNavLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
