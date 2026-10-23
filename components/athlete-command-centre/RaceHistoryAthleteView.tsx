"use client";

import { useCallback, useState } from "react";
import {
  HYROX_RACE_RUN_KEYS,
  HYROX_RACE_RUN_LABELS,
  HYROX_RACE_STATION_KEYS,
  HYROX_RACE_STATION_LABELS,
  progressCopy,
  type HyroxRaceHistoryItem,
  type HyroxRaceObservation,
} from "@/app/lib/hyroxRaceIntelligence";
import type { HyroxRaceCompleteness, HyroxRaceRecord } from "@/app/lib/hyroxRaceIntelligenceTypes";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import {
  athleteCard,
  athleteCardPadding,
  btnPrimaryClass,
  btnSecondaryClass,
  eyebrowClass,
} from "./athleteUi";

type Payload = {
  success?: boolean;
  error?: string;
  races?: HyroxRaceHistoryItem[];
  race?: HyroxRaceHistoryItem;
};

function formatDate(value: string | null): string {
  if (!value) return "Date not recorded";
  const iso = value.slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}`;
}

function completenessLabel(value: HyroxRaceCompleteness): string {
  if (value === "full") return "Full splits";
  if (value === "partial") return "Partial splits";
  if (value === "overall_only") return "Overall only";
  return "No result yet";
}

function resultDisplay(race: HyroxRaceRecord): string {
  return race.overall.display ?? "No overall time";
}

export function RaceSplitBreakdown({ race }: { race: HyroxRaceRecord }) {
  const runRows = HYROX_RACE_RUN_KEYS.map((key) => ({
    key,
    label: HYROX_RACE_RUN_LABELS[key],
    display: race.runs[key].display,
  }));
  const stationRows = HYROX_RACE_STATION_KEYS.map((key) => ({
    key,
    label: HYROX_RACE_STATION_LABELS[key],
    display: race.stations[key].display,
  }));
  const hasRuns = runRows.some((row) => row.display);
  const hasStations = stationRows.some((row) => row.display);
  return (
    <div className="mt-4 space-y-4 text-sm">
      <div>
        <p className={eyebrowClass}>Runs</p>
        {hasRuns ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            {runRows.map((row) => (
              <div key={row.key}>
                <dt className="text-xs text-zinc-500">{row.label}</dt>
                <dd className="text-zinc-200">{row.display ?? "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-zinc-500">No run splits recorded.</p>
        )}
      </div>
      <div>
        <p className={eyebrowClass}>Stations</p>
        {hasStations ? (
          <dl className="mt-2 space-y-1">
            {stationRows.map((row) => (
              <div key={row.key} className="flex justify-between gap-3">
                <dt className="text-zinc-400">{row.label}</dt>
                <dd className="text-zinc-200">{row.display ?? "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-zinc-500">No station splits recorded.</p>
        )}
      </div>
      <div>
        <p className={eyebrowClass}>Roxzone</p>
        <p className="mt-2 text-zinc-200">{race.roxzone.display ?? "Not recorded"}</p>
      </div>
    </div>
  );
}

const ATHLETE_OBSERVATION_KINDS = new Set([
  "run_summary",
  "run_fade",
  "station_total",
  "roxzone",
  "overall_vs_previous",
  "station_vs_previous",
  "run_vs_previous",
  "goal",
]);

export function RaceObservationsList({
  observations,
  athleteFacing = false,
}: {
  observations: HyroxRaceObservation[];
  athleteFacing?: boolean;
}) {
  const rows = athleteFacing
    ? observations.filter((item) => ATHLETE_OBSERVATION_KINDS.has(item.kind))
    : observations;
  if (!rows.length) {
    return <p className="text-sm text-zinc-500">No split comparisons yet — more detail appears when splits are recorded.</p>;
  }
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed text-zinc-300">
      {rows.map((item) => (
        <li key={`${item.kind}-${item.text}`}>{item.text}</li>
      ))}
    </ul>
  );
}

function RaceForm({
  onSubmit,
  busy,
}: {
  onSubmit: (body: Record<string, string | Record<string, string>>) => Promise<void>;
  busy: boolean;
}) {
  const [eventName, setEventName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [division, setDivision] = useState("");
  const [overallTime, setOverallTime] = useState("");
  const [goalTime, setGoalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [roxzone, setRoxzone] = useState("");
  const [runs, setRuns] = useState<Record<string, string>>({});
  const [stations, setStations] = useState<Record<string, string>>({});

  const field = "mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/60";

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          eventName,
          raceDate,
          division,
          overallTime,
          goalTime,
          notes,
          roxzone,
          runs,
          stations,
        });
      }}
    >
      <label className="block text-sm text-zinc-400">
        Event name
        <input className={field} value={eventName} onChange={(e) => setEventName(e.target.value)} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-zinc-400">
          Date
          <input className={field} type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
        </label>
        <label className="block text-sm text-zinc-400">
          Division
          <input className={field} value={division} onChange={(e) => setDivision(e.target.value)} placeholder="Open, Pro, Doubles…" />
        </label>
        <label className="block text-sm text-zinc-400">
          Overall time
          <input className={field} value={overallTime} onChange={(e) => setOverallTime(e.target.value)} placeholder="1:04:14" />
        </label>
      </div>
      <label className="block text-sm text-zinc-400">
        Goal time (optional)
        <input className={field} value={goalTime} onChange={(e) => setGoalTime(e.target.value)} placeholder="1:00:00" />
      </label>
      <details className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-200">Splits (optional)</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HYROX_RACE_RUN_KEYS.map((key) => (
            <label key={key} className="block text-xs text-zinc-500">
              {HYROX_RACE_RUN_LABELS[key]}
              <input className={field} value={runs[key] ?? ""} onChange={(e) => setRuns((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="5:12" />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {HYROX_RACE_STATION_KEYS.map((key) => (
            <label key={key} className="block text-xs text-zinc-500">
              {HYROX_RACE_STATION_LABELS[key]}
              <input className={field} value={stations[key] ?? ""} onChange={(e) => setStations((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="4:20" />
            </label>
          ))}
          <label className="block text-xs text-zinc-500">
            Roxzone
            <input className={field} value={roxzone} onChange={(e) => setRoxzone(e.target.value)} placeholder="7:40" />
          </label>
        </div>
      </details>
      <label className="block text-sm text-zinc-400">
        Notes
        <textarea className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="submit" className={btnPrimaryClass} disabled={busy}>
        {busy ? "Saving…" : "Save race"}
      </button>
    </form>
  );
}

export function RaceHistoryAthleteView({ readOnly = false }: { readOnly?: boolean }) {
  const preview = useAthleteAdminPreview();
  const athleteId = preview?.portalAthlete.id ?? null;
  const locked = readOnly || Boolean(preview?.readOnly);
  const [items, setItems] = useState<HyroxRaceHistoryItem[] | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const loadKey = athleteId ?? "self";

  const load = useCallback(async () => {
    const url = athleteId
      ? `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/races`
      : "/api/hyrox/athlete/races";
    const res = await fetch(url, { credentials: "include" });
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) {
      setError(json.error ?? "Could not load races.");
      setItems(null);
      return;
    }
    setError(null);
    setItems(json.races ?? []);
  }, [athleteId]);

  if (loadedKey !== loadKey) {
    setLoadedKey(loadKey);
    void load();
  }

  async function save(body: Record<string, string | Record<string, string>>) {
    if (locked) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = athleteId
        ? `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/races`
        : "/api/hyrox/athlete/races";
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as Payload;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not save race.");
        return;
      }
      setNotice("Race saved.");
      setOpenForm(false);
      await load();
    } catch {
      setError("Network error saving race.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className="text-sm text-amber-200">{error}</p>
          <button type="button" className={`${btnSecondaryClass} mt-3`} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}
      {notice ? <p className="text-sm text-zinc-400">{notice}</p> : null}
      {items == null && !error ? <p className="text-sm text-zinc-500">Loading races…</p> : null}
      {items && !items.length ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className="text-sm font-semibold text-white">No races recorded</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            When you or your coach add a HYROX result, it will show here. Nothing is estimated.
          </p>
        </div>
      ) : null}
      {items?.map(({ race, analysis }) => {
        const progress = progressCopy(analysis);
        return (
          <article key={race.id} className={`${athleteCard} ${athleteCardPadding}`}>
            <p className={eyebrowClass}>{completenessLabel(analysis.completeness)}</p>
            <h2 className="mt-1 text-base font-semibold text-white">{race.eventName}</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">{resultDisplay(race)}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {[race.division, formatDate(race.raceDate)].filter(Boolean).join(" · ")}
            </p>
            {progress ? <p className="mt-2 text-sm text-zinc-300">{progress}</p> : null}
            {race.notes ? <p className="mt-3 text-sm leading-relaxed text-zinc-400">{race.notes}</p> : null}
            <details className="mt-4">
              <summary className="cursor-pointer min-h-[44px] text-sm font-semibold text-yellow-400">
                Breakdown
              </summary>
              <RaceSplitBreakdown race={race} />
              <div className="mt-4">
                <p className={eyebrowClass}>From your splits</p>
                <div className="mt-2">
                  <RaceObservationsList observations={analysis.observations} athleteFacing />
                </div>
              </div>
            </details>
          </article>
        );
      })}
      {locked ? null : (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          {openForm ? (
            <>
              <p className="text-sm font-semibold text-white">Add a race</p>
              <p className="mt-1 text-sm text-zinc-500">Incomplete results are fine. Leave splits blank if you only have a finish time.</p>
              <RaceForm onSubmit={save} busy={busy} />
            </>
          ) : (
            <button type="button" className={btnSecondaryClass} onClick={() => setOpenForm(true)}>
              Add a race
            </button>
          )}
        </div>
      )}
    </div>
  );
}
