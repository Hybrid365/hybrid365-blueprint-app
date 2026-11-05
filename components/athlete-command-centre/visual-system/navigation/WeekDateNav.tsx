"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion, vsTransition } from "../motion";
import type { SessionStatusKey } from "../tokens";

export type WeekDateNavDay = {
  id: string;
  dow: string;
  dateNumber: number;
  isToday?: boolean;
  /** Session status dots — length = session count on that day. */
  sessionStatuses?: SessionStatusKey[];
};

export function WeekDateNav({
  days,
  selectedId,
  onSelect,
  className,
}: {
  days: WeekDateNavDay[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <nav
      aria-label="Training week"
      className={cn(
        "grid grid-cols-7 gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {days.map((d) => {
        const isSel = d.id === selectedId;
        const isToday = Boolean(d.isToday);
        const statuses = d.sessionStatuses ?? [];
        const rest = statuses.length === 0;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            aria-current={isSel ? "date" : undefined}
            aria-label={`${d.dow} ${d.dateNumber}${isToday ? ", today" : ""}${
              rest
                ? ", rest day"
                : `, ${statuses.length} session${statuses.length > 1 ? "s" : ""}`
            }`}
            className="relative flex min-h-11 flex-col items-center gap-1.5 rounded-lg py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--h365-accent)]"
          >
            {isSel ? (
              <motion.span
                layoutId={reduced ? undefined : "vs-day-pill"}
                aria-hidden
                className="absolute inset-0 rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface-raised)]"
                transition={vsTransition(reduced, 0.2)}
              />
            ) : null}
            <span
              className={cn(
                "relative label-caps text-[10px]",
                isToday
                  ? "text-[var(--h365-accent)]"
                  : isSel
                    ? "text-[var(--h365-text)]"
                    : "text-[var(--h365-text-muted)]"
              )}
            >
              {isToday ? "Today" : d.dow}
            </span>
            <span
              className={cn(
                "relative font-display text-xl font-semibold leading-none num transition-colors duration-150",
                isSel
                  ? "text-[var(--h365-text)]"
                  : isToday
                    ? "text-[var(--h365-accent)]"
                    : "text-[var(--h365-text-muted)]"
              )}
            >
              {d.dateNumber}
            </span>
            <span className="relative flex h-1.5 items-center gap-1" aria-hidden>
              {rest ? (
                <span className="h-px w-2.5 bg-[var(--h365-text-muted)]/40" />
              ) : (
                statuses.map((st, si) => {
                  const done = st === "completed";
                  return (
                    <span
                      key={`${d.id}-${si}`}
                      className={cn(
                        "size-1.5 rounded-full",
                        si === 0
                          ? done
                            ? "bg-[var(--h365-accent)]"
                            : "border border-[var(--h365-accent)] bg-transparent"
                          : done
                            ? "bg-[var(--h365-text)]/70"
                            : "border border-[var(--h365-text-muted)]/60"
                      )}
                    />
                  );
                })
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
