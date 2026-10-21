"use client";

import { useCallback, useState } from "react";
import {
  ATHLETE_SUBMIT_TYPES,
  benchmarkAgeLabel,
  benchmarkFamily,
  benchmarkLabel,
  presentBenchmark,
  type BenchmarkType,
  type HyroxAthleteBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkTypes";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { athleteCard, athleteCardPadding, btnPrimaryClass, btnSecondaryClass, eyebrowClass } from "./athleteUi";

type Payload = {
  success?: boolean;
  unavailable?: boolean;
  error?: string;
  profile?: HyroxAthletePerformanceProfile;
  results?: HyroxAthleteBenchmarkRow[];
};

const FAMILIES = ["Running", "Ergs", "Bike", "HYROX", "Strength"] as const;

function statusLabel(row: HyroxAthleteBenchmarkRow): string {
  if (row.status === "pending") return "Pending review";
  if (row.status === "historical") return "Historical";
  if (row.active_for_programming) return "Current";
  if (row.source === "coach_entered" || row.source === "lab_test") return "Coach verified";
  return "Approved";
}

function fieldClass() {
  return "mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/60";
}

export function PerformanceProfileAthleteView({ readOnly = false }: { readOnly?: boolean }) {
  const preview = useAthleteAdminPreview();
  const athleteId = preview?.portalAthlete.id ?? null;
  const locked = readOnly || Boolean(preview?.readOnly);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [benchmarkType, setBenchmarkType] = useState<BenchmarkType>("run_5k");
  const [time, setTime] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [watts, setWatts] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [reps, setReps] = useState("1");
  const [date, setDate] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [environment, setEnvironment] = useState("road");
  const [division, setDivision] = useState("");
  const [eventName, setEventName] = useState("");
  const [notes, setNotes] = useState("");

  const loadKey = athleteId ?? "self";

  const load = useCallback(async () => {
    const url = athleteId
      ? `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/benchmarks`
      : "/api/hyrox/athlete/benchmarks";
    const res = await fetch(url, { credentials: "include" });
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) {
      setError(json.error ?? "Could not load benchmarks.");
      setPayload(null);
      return;
    }
    setError(null);
    setPayload(json);
  }, [athleteId]);

  if (loadedKey !== loadKey) {
    setLoadedKey(loadKey);
    void load();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (locked) return;
    setSubmitting(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/benchmarks", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          benchmarkType,
          time,
          distanceKm,
          watts,
          loadKg,
          reps,
          date,
          avgHr,
          maxHr,
          environment,
          division,
          eventName,
          notes,
        }),
      });
      const json = (await res.json()) as Payload;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not submit result.");
        return;
      }
      setNotice("Submitted for coach review. It will not change your current benchmarks until your coach approves it.");
      setOpen(false);
      setTime("");
      setDistanceKm("");
      setWatts("");
      setLoadKg("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  const results = payload?.results ?? [];
  const current = results.filter((row) => row.active_for_programming && row.status === "approved");

  return (
    <div className="space-y-8">
      {payload?.unavailable ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>Performance</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Benchmark history is not available until the performance profile database update is applied.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-amber-300/90">{error}</p> : null}
      {notice ? <p className="text-sm text-zinc-300">{notice}</p> : null}

      {FAMILIES.map((family) => {
        const rows = current.filter((row) => benchmarkFamily(row.benchmark_type) === family);
        if (!rows.length) return null;
        return (
          <section key={family} className="space-y-3">
            <p className={eyebrowClass}>{family}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => {
                const shown = presentBenchmark(row);
                const age = benchmarkAgeLabel(row.result_date);
                return (
                  <article key={row.id} className={`${athleteCard} ${athleteCardPadding}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {shown.label}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400/90">Current</p>
                    </div>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                      {shown.primary}
                    </p>
                    {shown.derived ? <p className="mt-1 text-sm text-zinc-300">{shown.derived}</p> : null}
                    {age ? <p className="mt-3 text-xs text-zinc-500">{age}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {!payload?.unavailable && !current.length && payload ? (
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className="text-sm leading-relaxed text-zinc-300">
            No current benchmarks yet. Submit a result for your coach to review.
          </p>
        </div>
      ) : null}

      {!locked ? (
        <section className={`${athleteCard} ${athleteCardPadding}`}>
          {!open ? (
            <button type="button" className={btnPrimaryClass} onClick={() => setOpen(true)}>
              Submit new result
            </button>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <p className={eyebrowClass}>Submit for coach review</p>
              <label className="block text-xs font-semibold text-zinc-400">
                Benchmark
                <select className={fieldClass()} value={benchmarkType} onChange={(event) => setBenchmarkType(event.target.value as BenchmarkType)}>
                  {ATHLETE_SUBMIT_TYPES.map((type) => (
                    <option key={type} value={type}>{benchmarkLabel(type)}</option>
                  ))}
                </select>
              </label>
              {benchmarkType === "run_5k" || benchmarkType === "run_10k" || benchmarkType === "ski_2k" || benchmarkType === "row_2k" || benchmarkType === "hyrox_race" ? (
                <label className="block text-xs font-semibold text-zinc-400">
                  Time
                  <input className={fieldClass()} value={time} onChange={(event) => setTime(event.target.value)} placeholder={benchmarkType === "hyrox_race" ? "1:04:14" : "17:42"} required />
                </label>
              ) : null}
              {benchmarkType === "run_30min" ? (
                <label className="block text-xs font-semibold text-zinc-400">
                  Distance (km)
                  <input className={fieldClass()} value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} placeholder="7.85" required />
                </label>
              ) : null}
              {benchmarkType === "ftp" ? (
                <label className="block text-xs font-semibold text-zinc-400">
                  Watts
                  <input className={fieldClass()} value={watts} onChange={(event) => setWatts(event.target.value)} placeholder="320" required />
                </label>
              ) : null}
              {benchmarkType === "squat" || benchmarkType === "deadlift" || benchmarkType === "bench" || benchmarkType === "military_press" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Load (kg)
                    <input className={fieldClass()} value={loadKg} onChange={(event) => setLoadKg(event.target.value)} required />
                  </label>
                  <label className="block text-xs font-semibold text-zinc-400">
                    Reps
                    <select className={fieldClass()} value={reps} onChange={(event) => setReps(event.target.value)}>
                      <option value="1">1RM</option>
                      <option value="3">3RM</option>
                      <option value="5">5RM</option>
                    </select>
                  </label>
                </div>
              ) : null}
              <label className="block text-xs font-semibold text-zinc-400">
                Date
                <input className={fieldClass()} type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
              {benchmarkType === "run_5k" || benchmarkType === "run_10k" ? (
                <label className="block text-xs font-semibold text-zinc-400">
                  Environment
                  <select className={fieldClass()} value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                    <option value="road">Road</option>
                    <option value="track">Track</option>
                    <option value="treadmill">Treadmill</option>
                    <option value="race">Race</option>
                  </select>
                </label>
              ) : null}
              {benchmarkType === "hyrox_race" ? (
                <>
                  <label className="block text-xs font-semibold text-zinc-400">
                    Division
                    <input className={fieldClass()} value={division} onChange={(event) => setDivision(event.target.value)} placeholder="Pro" />
                  </label>
                  <label className="block text-xs font-semibold text-zinc-400">
                    Event
                    <input className={fieldClass()} value={eventName} onChange={(event) => setEventName(event.target.value)} />
                  </label>
                </>
              ) : null}
              {benchmarkType !== "ftp" && benchmarkType !== "hyrox_race" && benchmarkType !== "squat" && benchmarkType !== "deadlift" && benchmarkType !== "bench" && benchmarkType !== "military_press" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Avg HR
                    <input className={fieldClass()} value={avgHr} onChange={(event) => setAvgHr(event.target.value)} inputMode="numeric" />
                  </label>
                  <label className="block text-xs font-semibold text-zinc-400">
                    Max HR
                    <input className={fieldClass()} value={maxHr} onChange={(event) => setMaxHr(event.target.value)} inputMode="numeric" />
                  </label>
                </div>
              ) : null}
              <label className="block text-xs font-semibold text-zinc-400">
                Notes
                <textarea className={fieldClass()} value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={btnPrimaryClass} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit for coach review"}
                </button>
                <button type="button" className={btnSecondaryClass} onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <p className="text-xs text-zinc-500">Read-only preview. Result submission is disabled.</p>
      )}

      {results.length ? (
        <section className="space-y-3">
          <p className={eyebrowClass}>History</p>
          <div className="space-y-2">
            {results.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {presentBenchmark(row).label} · {presentBenchmark(row).primary}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{row.result_date}</p>
                </div>
                <p className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  {statusLabel(row)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
