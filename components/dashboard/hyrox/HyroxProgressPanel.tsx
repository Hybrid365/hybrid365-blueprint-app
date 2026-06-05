"use client";

import { Activity, Flag, Gauge, Target, Timer, TrendingUp, Wind } from "lucide-react";
import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import type { CommunityHyroxCheckInDetails } from "@/app/lib/communityHyroxCheckIn";
import {
  formatHyroxMetric,
  getHyroxRaceCountdown,
  stationWeaknessLabel,
} from "@/app/lib/communityHyroxDashboard";

type BenchmarkLike = {
  test_type: string | null;
  test_time: string | null;
  test_value: number | null;
  tested_at: string | null;
};

function findLatestTest(tests: BenchmarkLike[], matchers: string[]): string {
  for (const m of matchers) {
    const hit = tests.find((t) =>
      String(t.test_type ?? "")
        .toLowerCase()
        .includes(m.toLowerCase())
    );
    if (hit?.test_time?.trim()) return hit.test_time.trim();
    if (hit?.test_value != null) return String(hit.test_value);
  }
  return "Not logged yet";
}

function ProgressCard({
  title,
  icon,
  value,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub?: string;
}) {
  const muted = value === "Not logged yet";
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className={`mt-3 text-xl font-bold ${muted ? "text-zinc-600" : "text-zinc-100"}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}

type Props = {
  details: CommunityHyroxDetails;
  benchmarkTests: BenchmarkLike[];
  latestHyroxCheckIn?: CommunityHyroxCheckInDetails | null;
};

export function HyroxProgressPanel({ details, benchmarkTests, latestHyroxCheckIn }: Props) {
  const countdown = getHyroxRaceCountdown(details.race_date);
  const run5k =
    findLatestTest(benchmarkTests, ["5km", "5k"]) !== "Not logged yet"
      ? findLatestTest(benchmarkTests, ["5km", "5k"])
      : formatHyroxMetric(details.current_5k_time);
  const ski =
    findLatestTest(benchmarkTests, ["ski"]) !== "Not logged yet"
      ? findLatestTest(benchmarkTests, ["ski"])
      : formatHyroxMetric(details.ski_1k_time);
  const row =
    findLatestTest(benchmarkTests, ["row"]) !== "Not logged yet"
      ? findLatestTest(benchmarkTests, ["row"])
      : formatHyroxMetric(details.row_1k_time);

  const compromised =
    latestHyroxCheckIn?.compromised_running_feel != null
      ? `${latestHyroxCheckIn.compromised_running_feel}/10 this week`
      : latestHyroxCheckIn?.running_after_stations_confidence != null
        ? `Stations → run: ${latestHyroxCheckIn.running_after_stations_confidence}/10`
        : "Not logged yet";

  const weaknessFocus =
    details.station_weaknesses.length > 0
      ? details.station_weaknesses.map(stationWeaknessLabel).join(" · ")
      : "Not logged yet";

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400/90">HYROX progress</p>
        <h2 className="mt-1 text-xl font-bold text-white">HYROX track markers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Assessment baselines and logged tests — deeper HYROX trends build as you check in and test.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ProgressCard title="Run engine" icon={<Activity className="h-4 w-4" />} value={run5k} sub="5K reference" />
        <ProgressCard
          title="Threshold development"
          icon={<TrendingUp className="h-4 w-4" />}
          value={formatHyroxMetric(details.current_10k_time)}
          sub="10K / threshold marker"
        />
        <ProgressCard title="Ski / Row benchmarks" icon={<Wind className="h-4 w-4" />} value={ski} sub={`Row: ${row}`} />
        <ProgressCard
          title="Station weakness focus"
          icon={<Target className="h-4 w-4" />}
          value={weaknessFocus}
        />
        <ProgressCard
          title="Compromised running confidence"
          icon={<Gauge className="h-4 w-4" />}
          value={compromised}
        />
        <ProgressCard
          title="Race countdown"
          icon={<Timer className="h-4 w-4" />}
          value={countdown ? countdown.label : "No race date set"}
          sub={details.target_time ? `Target: ${details.target_time}` : undefined}
        />
      </div>
    </section>
  );
}
