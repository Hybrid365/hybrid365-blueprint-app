"use client";

import { useEffect, useState } from "react";
import { Trophy, Target } from "lucide-react";
import { HYBRID75_POINTS_COPY } from "@/app/lib/hybrid75ChallengeLogging";
import type { Hybrid75LeaderboardRow } from "@/app/lib/hybrid75ChallengeLogging";

type Hybrid75LeaderboardProps = {
  planId: string;
  athleteName: string;
  pendingPoints: number;
  approvedPoints: number;
  totalPoints: number;
};

type LeaderboardResponse = {
  rows: Hybrid75LeaderboardRow[];
  hasOfficialRows: boolean;
  configured: boolean;
  user: {
    pending_points: number;
    approved_points: number;
    adjustment_points: number;
    total_points: number;
  } | null;
};

export default function Hybrid75Leaderboard({
  planId,
  athleteName,
  pendingPoints,
  approvedPoints,
  totalPoints,
}: Hybrid75LeaderboardProps) {
  const [rows, setRows] = useState<Hybrid75LeaderboardRow[]>([]);
  const [hasOfficialRows, setHasOfficialRows] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userSummary, setUserSummary] = useState<LeaderboardResponse["user"]>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/free-week/challenge-leaderboard?plan_id=${encodeURIComponent(planId)}`
        );
        const data = (await res.json()) as LeaderboardResponse;
        if (cancelled) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setHasOfficialRows(Boolean(data.hasOfficialRows));
        setUserSummary(data.user);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const displayPending = userSummary?.pending_points ?? pendingPoints;
  const displayApproved = userSummary?.approved_points ?? approvedPoints;
  const displayAdjustments = userSummary?.adjustment_points ?? 0;
  const displayTotal = userSummary?.total_points ?? totalPoints;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-7">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4D23C]/15">
          <Trophy className="h-5 w-5 text-[#F4D23C]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">Hybrid 75 Leaderboard</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Track your points and see how you stack up once proof posts are checked.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending points", value: displayPending },
          { label: "Approved points", value: displayApproved },
          { label: "Adjustments", value: displayAdjustments },
          { label: "Official total", value: displayTotal, highlight: true },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-4 ${
              item.highlight ? "border-[#F4D23C]/35 bg-[#F4D23C]/5" : "border-zinc-800 bg-zinc-950/70"
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-zinc-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{athleteName || "You"}</p>
          </div>
        ))}
      </div>

      <p className="mb-6 text-xs text-zinc-500">
        Pending points are not counted in official totals until approved.
      </p>

      <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-[#F4D23C]" />
          <p className="text-sm font-semibold text-white">Points system</p>
        </div>
        <ul className="space-y-2">
          {HYBRID75_POINTS_COPY.map((line) => (
            <li key={line} className="text-sm text-white/70">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="grid grid-cols-[48px_1fr_88px] gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <span>#</span>
          <span>Athlete</span>
          <span className="text-right">Points</span>
        </div>

        {loading ? (
          <p className="px-4 py-6 text-sm text-zinc-500">Loading leaderboard…</p>
        ) : rows.length === 0 || !hasOfficialRows ? (
          <p className="px-4 py-6 text-sm text-zinc-400">
            Leaderboard goes live once the first proof posts are checked.
          </p>
        ) : (
          rows.map((row, index) => {
            const isYou = row.plan_id === planId;
            return (
              <div
                key={row.key}
                className={`grid grid-cols-[48px_1fr_88px] gap-2 border-b border-zinc-800/80 px-4 py-3 last:border-b-0 ${
                  isYou ? "bg-[#F4D23C]/5" : "bg-zinc-950/40"
                }`}
              >
                <span className="text-sm font-bold text-zinc-400">{index + 1}</span>
                <span className={`truncate text-sm ${isYou ? "font-semibold text-white" : "text-zinc-300"}`}>
                  {row.name}
                  {isYou ? " (You)" : ""}
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-white">
                  {row.total_points}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
