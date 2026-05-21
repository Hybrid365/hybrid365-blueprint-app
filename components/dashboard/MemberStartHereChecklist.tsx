"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gauge,
  LayoutGrid,
  ListChecks,
  MessageCircle,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { useDismissibleStartHere } from "@/components/dashboard/useDismissibleStartHere";

export type StartHereChecklistState = {
  assessmentCompleted: boolean;
  coreTestsLogged: number;
  programmeGenerated: boolean;
  hasCompletedSession: boolean;
  hasHabitLog: boolean;
  hasCheckIn: boolean;
  homeScreenHintDone: boolean;
};

type Props = StartHereChecklistState & {
  onGenerateProgramme?: () => void;
  generatingProgramme?: boolean;
  forceShow: boolean;
  compact?: boolean;
};

type Item = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  action?: "generate";
  external?: boolean;
};

const COMMUNITY_URL = "https://plan.hybrid-365.com/community";

export function MemberStartHereChecklist({
  assessmentCompleted,
  coreTestsLogged,
  programmeGenerated,
  hasCompletedSession,
  hasHabitLog,
  hasCheckIn,
  homeScreenHintDone,
  onGenerateProgramme,
  generatingProgramme,
  forceShow,
  compact,
}: Props) {
  const { visible, dismissed, dismiss, showAgain } = useDismissibleStartHere(forceShow);

  const items: Item[] = [
    {
      id: "assessment",
      label: "Complete Athlete Assessment",
      done: assessmentCompleted,
      href: "/dashboard/assessment",
    },
    {
      id: "baseline",
      label: "Add baseline tests",
      done: coreTestsLogged >= 4,
      href: "/dashboard/testing",
    },
    {
      id: "generate",
      label: "Generate your 12-week programme",
      done: programmeGenerated,
      action: assessmentCompleted && !programmeGenerated ? "generate" : undefined,
      href: programmeGenerated ? "/dashboard/programme" : undefined,
    },
    {
      id: "homescreen",
      label: "Save Hybrid365 to your phone home screen",
      done: homeScreenHintDone,
    },
    {
      id: "telegram",
      label: "Join Telegram / community",
      done: false,
      href: COMMUNITY_URL,
      external: true,
    },
    {
      id: "first-session",
      label: "Complete your first session",
      done: hasCompletedSession,
      href: "/dashboard/programme",
    },
    {
      id: "habits",
      label: "Log habits",
      done: hasHabitLog,
      href: "/dashboard/habits",
    },
    {
      id: "checkin",
      label: "Submit weekly check-in",
      done: hasCheckIn,
      href: "/dashboard",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (!visible && dismissed && !forceShow) {
    return (
      <p className="mb-6 text-center">
        <button
          type="button"
          onClick={showAgain}
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-yellow-400/90 hover:underline"
        >
          Show start here checklist
        </button>
      </p>
    );
  }

  if (!visible) return null;

  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 ${compact ? "mb-6 p-4 sm:p-5" : "mb-8 p-5 sm:p-6"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/90">Start here</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {allDone
              ? "You’ve covered the essentials — keep stacking sessions, habits and check-ins."
              : "Work through these once to get the most from Hybrid365."}
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500">
            {completedCount} of {items.length} complete
          </p>
        </div>
        {!forceShow ? (
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            I&apos;ve got it
          </button>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const icon =
            item.id === "assessment" ? ClipboardList
            : item.id === "baseline" ? Gauge
            : item.id === "generate" ? Sparkles
            : item.id === "homescreen" ? Smartphone
            : item.id === "telegram" ? MessageCircle
            : item.id === "first-session" ? Target
            : item.id === "habits" ? ListChecks
            : LayoutGrid;
          const Icon = icon;

          const rowClass = item.done
            ? "border-emerald-500/20 bg-emerald-950/15"
            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700";

          const inner = (
            <>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  item.done ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {item.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`min-w-0 flex-1 text-sm font-medium ${item.done ? "text-zinc-400" : "text-zinc-200"}`}>
                {item.label}
              </span>
              {!item.done && item.href ? <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" /> : null}
            </>
          );

          if (item.action === "generate" && onGenerateProgramme) {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={generatingProgramme}
                  onClick={onGenerateProgramme}
                  className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${rowClass}`}
                >
                  {inner}
                </button>
              </li>
            );
          }

          if (item.href && item.external) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-3 transition ${rowClass}`}
                >
                  {inner}
                </a>
              </li>
            );
          }

          if (item.href) {
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-3 transition ${rowClass}`}
                >
                  {inner}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <div className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-3 ${rowClass}`}>
                {inner}
              </div>
            </li>
          );
        })}
      </ul>

      {!forceShow ? (
        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-400"
        >
          Hide this checklist
        </button>
      ) : null}
    </section>
  );
}
