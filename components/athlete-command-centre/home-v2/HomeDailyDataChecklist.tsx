"use client";

import { Check } from "lucide-react";
import type { HomeDailyDataItem } from "@/app/lib/hyrox-team/modules/home/buildHomeDailyDataChecklist";
import { homeDailyDataProgress } from "@/app/lib/hyrox-team/modules/home/buildHomeDailyDataChecklist";
import { AthletePortalNavLink } from "../AthletePortalNavLink";
import { athleteCard, athleteCardPadding, eyebrowClass } from "../athleteUi";
import { usePrefersReducedMotion } from "./motion";

type Props = {
  items: HomeDailyDataItem[];
  painAlert?: boolean;
  onReadinessAction?: () => void;
  onSessionAction?: () => void;
  onCoachAck?: () => void;
  acknowledgingCoach?: boolean;
  readOnly?: boolean;
};

export function HomeDailyDataChecklist({
  items,
  painAlert,
  onReadinessAction,
  onSessionAction,
  onCoachAck,
  acknowledgingCoach,
  readOnly,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const { complete, total } = homeDailyDataProgress(items);
  if (!total) return null;

  return (
    <section className={`${athleteCard} ${athleteCardPadding} h-full`} aria-label="Today's data">
      <div className="flex items-baseline justify-between gap-2">
        <p className={eyebrowClass}>Today&apos;s data</p>
        <p className="text-xs font-bold tabular-nums text-yellow-400">
          {complete} of {total} complete
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-950">
        <div
          className="h-full rounded-full bg-yellow-400"
          style={{
            width: `${total ? (complete / total) * 100 : 0}%`,
            transition: reduced ? undefined : "width 0.5s ease",
          }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                item.done
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : item.required
                    ? "border-zinc-700 text-transparent"
                    : "border-zinc-800 text-transparent"
              }`}
              aria-hidden
            >
              <Check className="h-3 w-3" />
            </span>
            <span
              className={`min-w-0 flex-1 text-xs ${
                item.done
                  ? item.required
                    ? "text-zinc-500 line-through"
                    : "text-zinc-500"
                  : item.required
                    ? "text-zinc-200"
                    : "text-zinc-400"
              }`}
            >
              {item.label}
            </span>
            {!item.done && !readOnly && item.ctaLabel ? (
              <ActionButton
                item={item}
                onReadinessAction={onReadinessAction}
                onSessionAction={onSessionAction}
                onCoachAck={onCoachAck}
                acknowledgingCoach={acknowledgingCoach}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {painAlert ? (
        <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Illness or pain flagged — your coach can see this.
        </p>
      ) : null}
    </section>
  );
}

function ActionButton({
  item,
  onReadinessAction,
  onSessionAction,
  onCoachAck,
  acknowledgingCoach,
}: {
  item: HomeDailyDataItem;
  onReadinessAction?: () => void;
  onSessionAction?: () => void;
  onCoachAck?: () => void;
  acknowledgingCoach?: boolean;
}) {
  const className =
    "shrink-0 text-[10px] font-bold uppercase tracking-wide text-yellow-400 hover:text-yellow-300";

  if (item.action === "checkin") {
    return (
      <AthletePortalNavLink href="/athlete/check-in" className={className}>
        {item.ctaLabel}
      </AthletePortalNavLink>
    );
  }

  if (item.action === "readiness" && onReadinessAction) {
    return (
      <button type="button" onClick={onReadinessAction} className={className}>
        {item.ctaLabel}
      </button>
    );
  }

  if (item.action === "session" && onSessionAction) {
    return (
      <button type="button" onClick={onSessionAction} className={className}>
        {item.ctaLabel}
      </button>
    );
  }

  if (item.action === "coach_ack" && onCoachAck) {
    return (
      <button
        type="button"
        disabled={acknowledgingCoach}
        onClick={onCoachAck}
        className={className}
      >
        {acknowledgingCoach ? "…" : item.ctaLabel}
      </button>
    );
  }

  return null;
}
