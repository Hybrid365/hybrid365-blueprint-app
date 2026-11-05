"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Dumbbell, Footprints, Waves } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SessionStatusPill } from "../primitives/StatusPill";
import { CompactWorkoutPreview } from "../workout/CompactWorkoutPreview";
import { usePrefersReducedMotion, vsTransition } from "../motion";
import type { AthleteSessionCardViewModel } from "./sessionCardTypes";

function iconFor(category: string) {
  const c = category.toLowerCase();
  if (c.includes("strength")) return Dumbbell;
  if (c.includes("run") || c.includes("aerobic")) return Footprints;
  return Waves;
}

/**
 * Compact secondary session.
 * - With `onOpen`: opens SessionDrawer (Home D production path).
 * - Without `onOpen`: accordion expand (lab gallery).
 */
export function SecondarySessionRow({
  session,
  onOpen,
  className,
}: {
  session: AthleteSessionCardViewModel;
  onOpen?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const Icon = iconFor(session.categoryLabel);
  const panelId = `vs-panel-${session.id}`;
  const opensDrawer = typeof onOpen === "function";

  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]",
        className
      )}
      data-home-d-session={session.id}
    >
      <button
        type="button"
        onClick={() => {
          if (opensDrawer) onOpen();
          else setOpen((o) => !o);
        }}
        aria-expanded={opensDrawer ? undefined : open}
        aria-controls={opensDrawer ? undefined : panelId}
        className="flex w-full min-h-11 items-center gap-4 rounded-xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--h365-accent)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--h365-surface-raised)] text-[var(--h365-text)]">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <span className="label-caps truncate text-[var(--h365-text-muted)]">
              {session.categoryLabel}
              {session.durationLabel ? ` · ${session.durationLabel}` : ""}
            </span>
            <span className="shrink-0 sm:hidden">
              <SessionStatusPill status={session.status} />
            </span>
          </span>
          <span className="truncate font-display text-lg font-semibold uppercase leading-tight tracking-wide text-[var(--h365-text)]">
            {session.title}
          </span>
          {session.prescriptionLine ? (
            <span className="truncate text-xs text-[var(--h365-text-muted)]">
              {session.prescriptionLine}
            </span>
          ) : null}
        </span>
        <span className="hidden shrink-0 sm:block">
          <SessionStatusPill status={session.status} />
        </span>
        {opensDrawer ? (
          <ArrowUpRight className="size-4 shrink-0 text-[var(--h365-text-muted)]" aria-hidden />
        ) : (
          <motion.span
            animate={reduced ? undefined : { rotate: open ? 180 : 0 }}
            transition={vsTransition(reduced, 0.18)}
          >
            <ChevronDown className="size-4 text-[var(--h365-text-muted)]" aria-hidden />
          </motion.span>
        )}
      </button>
      {!opensDrawer ? (
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={panelId}
              key="panel"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={vsTransition(reduced, 0.2)}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 border-t border-[var(--h365-border)] px-4 pb-4 pt-4">
                {session.objective ? (
                  <p className="text-pretty text-sm leading-relaxed text-[var(--h365-text-muted)]">
                    {session.objective}
                  </p>
                ) : null}
                {session.timeline?.segments.length ? (
                  <CompactWorkoutPreview timeline={session.timeline} />
                ) : null}
                {session.primaryTarget ? (
                  <p className="text-xs text-[var(--h365-text-muted)]">
                    Target —{" "}
                    <span className="text-[var(--h365-text)]">{session.primaryTarget}</span>
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </article>
  );
}
