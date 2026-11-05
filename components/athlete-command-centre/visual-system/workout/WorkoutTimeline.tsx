"use client";

import { motion } from "motion/react";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import type { WorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { usePrefersReducedMotion, vsTransition } from "../motion";

function fmtClock(totalSec: number) {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function blockTone(kind: "work" | "recovery", modality: string) {
  if (kind === "recovery") return "bg-[var(--h365-recovery)]";
  if (modality === "station") return "bg-[var(--h365-text)]";
  return "bg-[var(--h365-accent)]";
}

export function WorkoutTimeline({
  timeline,
  selectedId,
  onSelect,
}: {
  timeline: WorkoutTimelineViewModel;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const items = timeline.segments;
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    items.findIndex((s) => s.id === selectedId)
  );
  const selected = items[selectedIndex];
  const proportional = timeline.canProportionByDuration;
  const total = timeline.totalDurationSec ?? items.length;

  const layout = useMemo(() => {
    let t = 0;
    return items.map((s) => {
      const dur = proportional ? (s.durationSec as number) : 1;
      const start = t;
      t += dur;
      return {
        s,
        left: (start / total) * 100,
        width: (dur / total) * 100,
      };
    });
  }, [items, proportional, total]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = Math.min(
      items.length - 1,
      Math.max(0, selectedIndex + (e.key === "ArrowRight" ? 1 : -1))
    );
    onSelect(items[next].id);
    btnRefs.current[next]?.focus();
  }

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--h365-text-muted)]">
        No timeline segments to display.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!proportional ? (
        <p className="text-[11px] text-[var(--h365-text-muted)]">
          Equal-width segments — duration missing for proportional layout.
        </p>
      ) : null}
      <div className="relative min-w-0 flex-1">
        <div className="relative h-48 sm:h-56">
          <div
            role="group"
            aria-label="Workout intervals — use arrow keys to move between segments"
            className="absolute inset-0"
            onKeyDown={onKeyDown}
          >
            {layout.map(({ s, left, width }, i) => {
              const isSel = s.id === selectedId;
              const isWork = s.kind === "work";
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={isSel ? 0 : -1}
                  aria-pressed={isSel}
                  aria-label={`${s.label}, ${
                    s.durationSec != null ? fmtClock(s.durationSec) : "duration unknown"
                  }${s.targetPace ? `, ${s.targetPace}` : ""}`}
                  onClick={() => onSelect(s.id)}
                  className="group absolute inset-y-0 flex min-w-[1.5rem] items-end px-px outline-none focus-visible:z-10"
                  style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                >
                  <motion.span
                    className={cn(
                      "relative flex w-full origin-bottom flex-col items-center justify-between overflow-hidden rounded-t-[3px] py-1.5",
                      blockTone(s.kind, s.modality),
                      !isSel && "opacity-40 group-hover:opacity-70",
                      "group-focus-visible:ring-2 group-focus-visible:ring-[var(--h365-accent)] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--h365-background)]"
                    )}
                    style={{ height: isWork ? "82%" : "36%" }}
                    initial={reduced ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={vsTransition(reduced, 0.4)}
                  >
                    {isWork ? (
                      <span className="font-display text-xs font-semibold leading-none text-[var(--h365-background)] num sm:text-sm">
                        {s.label.replace(/^R/, "") || s.label}
                      </span>
                    ) : null}
                    {s.durationSec != null ? (
                      <span
                        className={cn(
                          "hidden text-[10px] leading-none num sm:block",
                          isWork
                            ? "text-[var(--h365-background)]/80"
                            : "text-[var(--h365-text)]/70"
                        )}
                      >
                        {fmtClock(s.durationSec)}
                      </span>
                    ) : null}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative h-px bg-[var(--h365-border)]">
          {selected && layout[selectedIndex] ? (
            <motion.div
              aria-hidden
              className="absolute -top-px h-[3px] rounded-full bg-[var(--h365-accent)]"
              initial={false}
              animate={{
                left: `${layout[selectedIndex].left}%`,
                width: `${layout[selectedIndex].width}%`,
              }}
              transition={vsTransition(reduced, 0.2)}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--h365-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[var(--h365-accent)]" aria-hidden /> Effort
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[var(--h365-recovery)]" aria-hidden /> Recovery
        </span>
      </div>
    </div>
  );
}
