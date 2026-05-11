"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { countHabitsHit, HABIT_TOTAL, localDateKey } from "@/app/lib/dailyHabitLogs";

export function DashboardHabitsTeaser() {
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const today = localDateKey(new Date());
    let cancelled = false;
    fetch(`/api/dashboard/habit-logs?from=${today}&to=${today}`)
      .then((r) => r.json())
      .then((body: { logs?: DailyHabitLogRow[]; error?: string }) => {
        if (cancelled) return;
        if (!body.logs) {
          setDone(0);
          return;
        }
        const row = body.logs.find((l) => l.log_date === today);
        setDone(countHabitsHit(row ?? null));
      })
      .catch(() => {
        if (!cancelled) setDone(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const label = done === null ? "…" : `${done}/${HABIT_TOTAL}`;

  return (
    <Link
      href="/dashboard/habits"
      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
          <ListChecks className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Today&apos;s habits</p>
          <p className="text-xs text-zinc-500">{label} complete · tap to log</p>
        </div>
      </div>
      <span className="shrink-0 rounded-lg border border-yellow-500/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-200">
        Habits
      </span>
    </Link>
  );
}
