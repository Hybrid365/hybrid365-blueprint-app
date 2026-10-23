"use client";

import { useCallback, useState } from "react";
import {
  COACH_ENTRY_TYPES,
  benchmarkAgeLabel,
  benchmarkFamily,
  benchmarkLabel,
  presentBenchmark,
  type BenchmarkType,
  type HyroxAthleteBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkTypes";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import type { BenchmarkCoachAction } from "@/app/lib/hyroxBenchmarkWorkflow";

type Payload = {
  success?: boolean;
  unavailable?: boolean;
  error?: string;
  profile?: HyroxAthletePerformanceProfile;
  results?: HyroxAthleteBenchmarkRow[];
  result?: HyroxAthleteBenchmarkRow;
};

const FAMILIES = ["Running", "Ergs", "Bike", "HYROX", "Strength"] as const;

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-white";
}

export function PerformanceProfileCoachPanel({ athleteId }: { athleteId: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [benchmarkType, setBenchmarkType] = useState<BenchmarkType>("threshold_pace");
  const [time, setTime] = useState("");
  const [pace, setPace] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [watts, setWatts] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [reps, setReps] = useState("3");
  const [date, setDate] = useState("");
  const [source, setSource] = useState<"coach_entered" | "lab_test" | "imported">("coach_entered");
  const [makeActive, setMakeActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [thresholdHr, setThresholdHr] = useState("");
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID());

  const load = useCallback(async () => {
    const res = await fetch(`/api/hyrox/athletes/${encodeURIComponent(athleteId)}/benchmarks`, {
      credentials: "include",
    });
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) {
      setError(json.error ?? "Could not load the performance profile.");
      setPayload(null);
      return;
    }
    setError(null);
    setPayload(json);
  }, [athleteId]);

  if (loadedFor !== athleteId) {
    setLoadedFor(athleteId);
    void load();
  }

  async function act(benchmarkId: string, action: BenchmarkCoachAction) {
    if (payload?.unavailable) return;
    setBusyId(benchmarkId);
    setError(null);
    try {
      const res = await fetch(
        `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/benchmarks/${encodeURIComponent(benchmarkId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const json = (await res.json()) as Payload;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not update the result.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function saveNotes(benchmarkId: string, notesValue: string) {
    if (payload?.unavailable) return;
    const current = results.find((row) => row.id === benchmarkId);
    if ((current?.notes ?? "") === notesValue.trim()) return;
    setBusyId(benchmarkId);
    const res = await fetch(
      `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/benchmarks/${encodeURIComponent(benchmarkId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      }
    );
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) setError(json.error ?? "Could not save notes.");
    else await load();
    setBusyId(null);
  }

  async function addResult(event: React.FormEvent) {
    event.preventDefault();
    if (payload?.unavailable) return;
    setError(null);
    const res = await fetch(`/api/hyrox/athletes/${encodeURIComponent(athleteId)}/benchmarks`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        benchmarkType,
        time,
        pace,
        distanceKm,
        watts,
        loadKg,
        reps,
        date,
        source,
        makeActive,
        notes,
        thresholdHr,
        submissionKey,
      }),
    });
    const json = (await res.json()) as Payload;
    if (!res.ok || !json.success) {
      setError(json.error ?? "Could not save the benchmark.");
      return;
    }
    setSubmissionKey(crypto.randomUUID());
    setTime("");
    setPace("");
    setDistanceKm("");
    setWatts("");
    setLoadKg("");
    setNotes("");
    await load();
  }

  const results = payload?.results ?? [];
  const pending = results.filter((row) => row.status === "pending");
  const visible = results.filter((row) => row.status !== "rejected");

  return (
    <div className="space-y-6">
      {payload?.unavailable ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Benchmark history is not available until migration 021 is applied. This screen will not write results until then.
        </p>
      ) : null}
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">Programming profile</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(payload?.profile?.readiness ?? []).map((item) => (
            <div key={item.type} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
              <span className="text-sm text-zinc-200">{item.label}</span>
              <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${item.state === "ready" ? "text-emerald-300" : "text-zinc-500"}`}>
                {item.state === "ready" ? "Ready" : "Missing"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {pending.length ? (
        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">Pending coach review</p>
          {pending.map((row) => (
            <article key={row.id} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  {presentBenchmark(row).label} · {presentBenchmark(row).primary}
                </p>
                <p className="text-xs text-zinc-500">{row.result_date} · {row.source.replaceAll("_", " ")}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "approve_and_activate")}>
                  Approve + use for programming
                </ActionButton>
                <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "approve")}>
                  Approve only
                </ActionButton>
                <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "reject")}>
                  Reject
                </ActionButton>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {FAMILIES.map((family) => {
        const rows = visible.filter((row) => benchmarkFamily(row.benchmark_type) === family && row.status !== "pending");
        if (!rows.length) return null;
        return (
          <section key={family} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{family}</p>
            {rows.map((row) => {
              const shown = presentBenchmark(row);
              return (
                <article key={row.id} className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {shown.label} · {shown.primary}
                      {shown.derived ? <span className="ml-2 font-medium text-zinc-400">{shown.derived}</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {row.active_for_programming ? "Active" : row.status === "historical" ? "Historical" : "Not active"}
                      {" · "}
                      {row.result_date}
                      {" · "}
                      {row.source.replaceAll("_", " ")}
                      {benchmarkAgeLabel(row.result_date) ? ` · ${benchmarkAgeLabel(row.result_date)}` : ""}
                    </p>
                    <input
                      key={`${row.id}:${row.notes ?? ""}`}
                      defaultValue={row.notes ?? ""}
                      placeholder="Notes"
                      className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
                      onBlur={(event) => void saveNotes(row.id, event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {row.status === "approved" && !row.active_for_programming ? (
                      <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "make_active")}>
                        Make active
                      </ActionButton>
                    ) : null}
                    {row.active_for_programming ? (
                      <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "remove_active")}>
                        Remove as active
                      </ActionButton>
                    ) : null}
                    {row.status === "approved" ? (
                      <ActionButton disabled={busyId === row.id} onClick={() => act(row.id, "mark_historical")}>
                        Mark historical
                      </ActionButton>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}

      {payload?.unavailable ? null : <form className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4" onSubmit={addResult}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">Add benchmark</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-400">
            Type
            <select className={inputClass()} value={benchmarkType} onChange={(event) => setBenchmarkType(event.target.value as BenchmarkType)}>
              {COACH_ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>{benchmarkLabel(type)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-400">
            Date
            <input className={inputClass()} type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          {benchmarkType === "threshold_pace" || benchmarkType === "hyrox_run_pace" ? (
            <label className="text-xs text-zinc-400">
              Pace
              <input className={inputClass()} value={pace} onChange={(event) => setPace(event.target.value)} placeholder="3:40/km" required />
            </label>
          ) : null}
          {benchmarkType === "run_5k" || benchmarkType === "run_10k" || benchmarkType === "ski_2k" || benchmarkType === "row_2k" || benchmarkType === "hyrox_race" ? (
            <label className="text-xs text-zinc-400">
              Time
              <input className={inputClass()} value={time} onChange={(event) => setTime(event.target.value)} placeholder="17:42" required />
            </label>
          ) : null}
          {benchmarkType === "run_30min" ? (
            <label className="text-xs text-zinc-400">
              Distance km
              <input className={inputClass()} value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} required />
            </label>
          ) : null}
          {benchmarkType === "ftp" ? (
            <label className="text-xs text-zinc-400">
              Watts
              <input className={inputClass()} value={watts} onChange={(event) => setWatts(event.target.value)} required />
            </label>
          ) : null}
          {benchmarkType === "threshold_pace" ? (
            <label className="text-xs text-zinc-400">
              Threshold HR
              <input className={inputClass()} value={thresholdHr} onChange={(event) => setThresholdHr(event.target.value)} />
            </label>
          ) : null}
          {benchmarkType === "squat" || benchmarkType === "deadlift" || benchmarkType === "bench" || benchmarkType === "military_press" ? (
            <>
              <label className="text-xs text-zinc-400">
                Load kg
                <input className={inputClass()} value={loadKg} onChange={(event) => setLoadKg(event.target.value)} required />
              </label>
              <label className="text-xs text-zinc-400">
                Reps
                <select className={inputClass()} value={reps} onChange={(event) => setReps(event.target.value)}>
                  <option value="1">1RM</option>
                  <option value="3">3RM</option>
                  <option value="5">5RM</option>
                </select>
              </label>
            </>
          ) : null}
          <label className="text-xs text-zinc-400">
            Source
            <select className={inputClass()} value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
              <option value="coach_entered">Coach entered</option>
              <option value="lab_test">Lab test</option>
              <option value="imported">Imported</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={makeActive} onChange={(event) => setMakeActive(event.target.checked)} />
          Set active for programming
        </label>
        <label className="block text-xs text-zinc-400">
          Notes
          <textarea className={inputClass()} rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button type="submit" className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-zinc-950">
          Save benchmark
        </button>
      </form>}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-yellow-500/40 hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}
