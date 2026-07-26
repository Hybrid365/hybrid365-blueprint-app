"use client";

import { useState } from "react";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import type { CoachHubFlag } from "@/app/lib/hyrox-team/modules/performanceHub/types";

type SummaryResponse = {
  success?: boolean;
  error?: string;
  coachFlags?: CoachHubFlag[];
  readiness?: {
    currentScore: number | null;
    avg7d: number | null;
    trend: string;
    illnessDays: number;
    highSorenessDays: number;
  };
  summary?: Array<{ key: string; label: string; display: string }>;
  dataNotes?: string[];
};

function severityClass(s: CoachHubFlag["severity"]) {
  if (s === "alert") return "border-red-500/40 text-red-200";
  if (s === "watch") return "border-amber-500/40 text-amber-200";
  return "border-zinc-600 text-zinc-300";
}

async function loadSummary(athleteId: string): Promise<SummaryResponse> {
  const res = await fetch(
    `/api/hyrox/athletes/${athleteId}/performance-hub-summary?range=this_week`,
    { credentials: "include" }
  );
  return (await res.json()) as SummaryResponse;
}

export function CoachPerformanceHubPanel({ athleteId }: { athleteId: string }) {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (loadedFor !== athleteId) {
    setLoadedFor(athleteId);
    setLoading(true);
    void loadSummary(athleteId)
      .then((json) => {
        if (json.success === false) {
          setError(json.error ?? "Failed");
          setData(null);
        } else {
          setData(json);
          setError(null);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed");
        setLoading(false);
      });
  }

  return (
    <DashCard>
      <SectionHeading title="Performance Hub summary" />
      <p className="mb-3 text-xs text-zinc-500">
        This week — read-only flags from programme logs, readiness and benchmarks.
      </p>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}
      {data ? (
        <div className="space-y-4">
          {data.readiness ? (
            <p className="text-sm text-zinc-300">
              Readiness: {data.readiness.currentScore ?? "—"} · 7d avg{" "}
              {data.readiness.avg7d ?? "—"} · trend {data.readiness.trend}
              {data.readiness.illnessDays > 0
                ? ` · illness ${data.readiness.illnessDays}d`
                : ""}
              {data.readiness.highSorenessDays > 0
                ? ` · high soreness ${data.readiness.highSorenessDays}d`
                : ""}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(data.coachFlags ?? []).map((f) => (
              <span
                key={f.id}
                title={f.detail}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClass(f.severity)}`}
              >
                {f.label}
              </span>
            ))}
            {!data.coachFlags?.length ? (
              <span className="text-xs text-zinc-500">No flags for this week.</span>
            ) : null}
          </div>
          {data.summary?.length ? (
            <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {data.summary.slice(0, 4).map((m) => (
                <div key={m.key} className="rounded-lg border border-zinc-800 px-2 py-1.5">
                  <dt className="text-zinc-500">{m.label}</dt>
                  <dd className="font-semibold text-white">{m.display}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {data.dataNotes?.length ? (
            <p className="text-[11px] text-zinc-600">{data.dataNotes[0]}</p>
          ) : null}
        </div>
      ) : null}
    </DashCard>
  );
}
