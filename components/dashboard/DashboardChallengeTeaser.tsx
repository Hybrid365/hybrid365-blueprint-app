"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

type Summary = {
  challengeWeek: number;
  habitTodayPoints: number;
  provisionalTotal: number;
};

export function DashboardChallengeTeaser() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/challenge-summary")
      .then((r) => r.json())
      .then((body: Summary & { error?: string }) => {
        if (cancelled || body.error) return;
        setSummary({
          challengeWeek: body.challengeWeek,
          habitTodayPoints: body.habitTodayPoints,
          provisionalTotal: body.provisionalTotal,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const w = summary?.challengeWeek ?? "—";
  const pts = summary?.provisionalTotal ?? "—";
  const habit = summary?.habitTodayPoints ?? "—";

  return (
    <Link
      href="/dashboard/challenge"
      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
          <Trophy className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Hybrid Challenge</p>
          <p className="text-xs text-zinc-500">
            Week {w} · Today +{habit} habit pts · ~{pts} provisional pts
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-lg border border-yellow-500/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-200">
        Challenge
      </span>
    </Link>
  );
}
