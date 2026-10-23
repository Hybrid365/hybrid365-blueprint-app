"use client";

import { useCallback, useState } from "react";
import {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_RUN_LABELS,
  HYROX_RACE_STATION_KEYS,
  HYROX_RACE_STATION_LABELS,
  progressCopy,
  type HyroxRaceHistoryItem,
} from "@/app/lib/hyroxRaceIntelligence";
import {
  RaceObservationsList,
  RaceSplitBreakdown,
} from "@/components/athlete-command-centre/RaceHistoryAthleteView";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type Payload = {
  success?: boolean;
  error?: string;
  races?: HyroxRaceHistoryItem[];
};

function formatDate(value: string | null): string {
  if (!value) return "Date not recorded";
  return value.slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-white";

export function RaceIntelligenceCoachPanel({ athleteId }: { athleteId: string }) {
  const [items, setItems] = useState<HyroxRaceHistoryItem[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [eventName, setEventName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [division, setDivision] = useState("");
  const [category, setCategory] = useState("");
  const [overallTime, setOverallTime] = useState("");
  const [goalTime, setGoalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [roxzone, setRoxzone] = useState("");
  const [runs, setRuns] = useState<Record<string, string>>({});
  const [stations, setStations] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/hyrox/athletes/${encodeURIComponent(athleteId)}/races`, {
      credentials: "include",
    });
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) {
      setError(json.error ?? "Could not load races.");
      setItems(null);
      return;
    }
    setError(null);
    setItems(json.races ?? []);
  }, [athleteId]);

  if (loadedFor !== athleteId) {
    setLoadedFor(athleteId);
    void load();
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${encodeURIComponent(athleteId)}/races`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventName,
          raceDate,
          division,
          category,
          overallTime,
          goalTime,
          notes,
          roxzone,
          runs,
          stations,
        }),
      });
      const json = (await res.json()) as Payload & { error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not save race.");
        return;
      }
      setEventName("");
      setRaceDate("");
      setDivision("");
      setCategory("");
      setOverallTime("");
      setGoalTime("");
      setNotes("");
      setRoxzone("");
      setRuns({});
      setStations({});
      await load();
    } catch {
      setError("Network error saving race.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <DashCard>
        <SectionHeading title="Add race" />
        <p className="text-sm text-zinc-500">
          Append-only. Incomplete races are valid. Analysis uses stored seconds, not population ranks.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-zinc-500">
            Event
            <input className={inputClass} value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </label>
          <label className="text-xs text-zinc-500">
            Date
            <input className={inputClass} type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
          </label>
          <label className="text-xs text-zinc-500">
            Division
            <input className={inputClass} value={division} onChange={(e) => setDivision(e.target.value)} placeholder="Open / Pro / Doubles" />
          </label>
          <label className="text-xs text-zinc-500">
            Category
            <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Age group (optional)" />
          </label>
          <label className="text-xs text-zinc-500">
            Overall
            <input className={inputClass} value={overallTime} onChange={(e) => setOverallTime(e.target.value)} placeholder="1:04:14" />
          </label>
          <label className="text-xs text-zinc-500">
            Goal
            <input className={inputClass} value={goalTime} onChange={(e) => setGoalTime(e.target.value)} placeholder="1:00:00" />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {HYROX_RACE_RUN_KEYS.map((key) => (
            <label key={key} className="text-[11px] text-zinc-500">
              {HYROX_RACE_RUN_LABELS[key]}
              <input className={inputClass} value={runs[key] ?? ""} onChange={(e) => setRuns((prev) => ({ ...prev, [key]: e.target.value }))} />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {HYROX_RACE_STATION_KEYS.map((key) => (
            <label key={key} className="text-[11px] text-zinc-500">
              {HYROX_RACE_STATION_LABELS[key]}
              <input className={inputClass} value={stations[key] ?? ""} onChange={(e) => setStations((prev) => ({ ...prev, [key]: e.target.value }))} />
            </label>
          ))}
          <label className="text-[11px] text-zinc-500">
            Roxzone
            <input className={inputClass} value={roxzone} onChange={(e) => setRoxzone(e.target.value)} />
          </label>
        </div>
        <label className="mt-3 block text-xs text-zinc-500">
          Notes (athlete-visible)
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="mt-4 rounded-lg border border-zinc-600 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Append race"}
        </button>
      </DashCard>

      {error ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error}</p>
      ) : null}

      {items == null && !error ? <p className="text-sm text-zinc-500">Loading races…</p> : null}

      {items && !items.length ? (
        <DashCard>
          <SectionHeading title="Race history" />
          <p className="text-sm text-zinc-400">No races recorded for this athlete. Nothing is inferred from assessment or mock data.</p>
        </DashCard>
      ) : null}

      {items?.map(({ race, analysis }) => {
        const progress = progressCopy(analysis);
        return (
          <DashCard key={race.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SectionHeading title={race.eventName} />
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {analysis.completeness.replace("_", " ")} · {formatDate(race.raceDate)}
                  {race.division ? ` · ${race.division}` : ""}
                  {race.category ? ` · ${race.category}` : ""}
                </p>
              </div>
              <p className="text-2xl font-bold text-white">{race.overall.display ?? "—"}</p>
            </div>
            {progress ? <p className="mt-2 text-sm text-zinc-300">{progress}</p> : null}
            {race.goal.display ? <p className="mt-1 text-sm text-zinc-500">Goal {race.goal.display}</p> : null}
            <RaceSplitBreakdown race={race} />
            {race.notes ? (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Notes</p>
                <p className="mt-1 text-sm text-zinc-300">{race.notes}</p>
              </div>
            ) : null}
            {(race.selfReport.weakestStation || race.selfReport.weakestRun || race.selfReport.biggestLimiter) ? (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Athlete-reported</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {[
                    race.selfReport.weakestStation && `Weakest station: ${race.selfReport.weakestStation}`,
                    race.selfReport.weakestRun && `Hardest run: ${race.selfReport.weakestRun}`,
                    race.selfReport.biggestLimiter && `Limiter: ${race.selfReport.biggestLimiter}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ) : null}
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">From stored splits</p>
              <div className="mt-2">
                <RaceObservationsList observations={analysis.observations} />
              </div>
            </div>
          </DashCard>
        );
      })}
    </div>
  );
}
