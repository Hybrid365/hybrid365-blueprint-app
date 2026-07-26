"use client";

import { useState } from "react";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type Snapshot = {
  localDate: string;
  readinessSubmitted: boolean;
  readinessCategory: "green" | "amber" | "red" | null;
  readinessExplanation: string | null;
  readinessScore: number | null;
  feelingUnwell: boolean;
  highSoreness: boolean;
  muscleSoreness: number | null;
  coachingPrompt: string | null;
  sessionStatuses: Array<{
    id: string;
    name: string;
    status: string;
    logSubmitted: boolean;
    painTightness: boolean;
    plannedPace: string | null;
    completedSummary: string | null;
  }>;
};

function categoryClass(c: Snapshot["readinessCategory"]) {
  if (c === "green") return "text-emerald-300";
  if (c === "amber") return "text-amber-200";
  if (c === "red") return "text-red-300";
  return "text-zinc-400";
}

async function loadSnapshot(athleteId: string): Promise<Snapshot> {
  const res = await fetch(`/api/hyrox/athletes/${athleteId}/today-snapshot`, {
    credentials: "include",
  });
  const json = (await res.json()) as Snapshot & { success?: boolean; error?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json;
}

/**
 * Minimal coach Today visibility — Overview tab only.
 * Does not redesign the coach dashboard.
 */
export function CoachTodaySnapshotPanel({ athleteId }: { athleteId: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (loadedFor !== athleteId) {
    setLoadedFor(athleteId);
    setLoading(true);
    setError(null);
    void loadSnapshot(athleteId)
      .then((snap) => {
        setData(snap);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setData(null);
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      });
  }

  return (
    <DashCard className="mt-4">
      <SectionHeading title="Today snapshot" />
      <p className="mb-3 text-xs text-zinc-500">
        Morning readiness + today&apos;s sessions (HYROX Team Today V2)
      </p>
      {loading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : null}
      {error ? <p className="mt-3 text-sm text-amber-300">{error}</p> : null}
      {data ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Readiness</p>
              <p className={`mt-1 text-sm font-semibold ${categoryClass(data.readinessCategory)}`}>
                {data.readinessSubmitted
                  ? `${data.readinessCategory ?? "—"} · ${data.readinessScore ?? "—"}`
                  : "Missing"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Illness</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {data.feelingUnwell ? "Flagged" : "No"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">High soreness</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {data.highSoreness
                  ? `Yes${data.muscleSoreness != null ? ` (${data.muscleSoreness}/10)` : ""}`
                  : "No"}
              </p>
            </div>
          </div>
          {data.readinessExplanation ? (
            <p className="text-sm text-zinc-300">{data.readinessExplanation}</p>
          ) : null}
          {data.coachingPrompt ? (
            <p className="text-sm text-zinc-400">{data.coachingPrompt}</p>
          ) : null}

          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Sessions · {data.localDate}
            </p>
            {data.sessionStatuses.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Recovery / no sessions today</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.sessionStatuses.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-white">{s.name}</span>
                      <span className="text-xs text-zinc-400">{s.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Log: {s.logSubmitted ? "submitted" : "missing"}
                      {s.painTightness ? " · Pain/tightness flagged" : ""}
                    </p>
                    {(s.plannedPace || s.completedSummary) && (
                      <p className="mt-1 text-xs text-zinc-400">
                        Planned: {s.plannedPace ?? "—"} · Completed: {s.completedSummary ?? "—"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </DashCard>
  );
}
