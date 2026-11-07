"use client";

import { useCallback, useState } from "react";
import {
  ATHLETE_SUBMIT_TYPES,
  benchmarkLabel,
  type BenchmarkType,
  type HyroxAthleteBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkTypes";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { athleteCard, athleteCardPadding, btnPrimaryClass, btnSecondaryClass } from "./athleteUi";
import { PerformanceExperience } from "./performance/PerformanceExperience";

type Payload = {
  success?: boolean;
  unavailable?: boolean;
  error?: string;
  profile?: HyroxAthletePerformanceProfile;
  results?: HyroxAthleteBenchmarkRow[];
};

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
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID());

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
          submissionKey,
        }),
      });
      const json = (await res.json()) as Payload & { duplicate?: boolean };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not submit result.");
        return;
      }
      setSubmissionKey(crypto.randomUUID());
      setNotice(
        json.duplicate
          ? "This result was already submitted. It is pending coach review."
          : "Submitted for coach review. It will not change your current benchmarks until your coach approves it."
      );
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

  if (!payload && !error) {
    return (
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm text-zinc-400">Loading current performance marks…</p>
      </div>
    );
  }

  if (payload?.unavailable) {
    return (
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">Performance</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Benchmark history is not available until the performance profile database update is applied.
        </p>
      </div>
    );
  }

  const submitSlot = locked ? (
    <p className="text-xs text-zinc-500">Read-only preview. Result submission is disabled.</p>
  ) : (
    <section className={`${athleteCard} ${athleteCardPadding}`} data-h365-performance-submit="">
      {error ? <p className="mb-3 text-sm text-amber-300/90">{error}</p> : null}
      {notice ? <p className="mb-3 text-sm text-zinc-300">{notice}</p> : null}
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">Update</p>
            <p className="mt-1 text-sm text-zinc-400">
              Submit a new result for coach review — it will not become an anchor until activated.
            </p>
          </div>
          <button type="button" className={btnPrimaryClass} onClick={() => setOpen(true)}>
            Submit new result
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
            Submit for coach review
          </p>
          <label className="block text-xs font-semibold text-zinc-400">
            Benchmark
            <select
              className={fieldClass()}
              value={benchmarkType}
              onChange={(event) => setBenchmarkType(event.target.value as BenchmarkType)}
            >
              {ATHLETE_SUBMIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {benchmarkLabel(type)}
                </option>
              ))}
            </select>
          </label>
          {benchmarkType === "run_5k" ||
          benchmarkType === "run_10k" ||
          benchmarkType === "ski_2k" ||
          benchmarkType === "row_2k" ||
          benchmarkType === "hyrox_race" ? (
            <label className="block text-xs font-semibold text-zinc-400">
              Time
              <input
                className={fieldClass()}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder={benchmarkType === "hyrox_race" ? "1:04:14" : "17:42"}
                required
              />
            </label>
          ) : null}
          {benchmarkType === "run_30min" ? (
            <label className="block text-xs font-semibold text-zinc-400">
              Distance (km)
              <input
                className={fieldClass()}
                value={distanceKm}
                onChange={(event) => setDistanceKm(event.target.value)}
                placeholder="7.85"
                required
              />
            </label>
          ) : null}
          {benchmarkType === "ftp" ? (
            <label className="block text-xs font-semibold text-zinc-400">
              Watts
              <input
                className={fieldClass()}
                value={watts}
                onChange={(event) => setWatts(event.target.value)}
                placeholder="320"
                required
              />
            </label>
          ) : null}
          {benchmarkType === "squat" ||
          benchmarkType === "deadlift" ||
          benchmarkType === "bench" ||
          benchmarkType === "military_press" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-zinc-400">
                Load (kg)
                <input
                  className={fieldClass()}
                  value={loadKg}
                  onChange={(event) => setLoadKg(event.target.value)}
                  required
                />
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
            <input
              className={fieldClass()}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          {benchmarkType === "run_5k" || benchmarkType === "run_10k" ? (
            <label className="block text-xs font-semibold text-zinc-400">
              Environment
              <select
                className={fieldClass()}
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
              >
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
                <input
                  className={fieldClass()}
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                  placeholder="Pro"
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-400">
                Event
                <input
                  className={fieldClass()}
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                />
              </label>
            </>
          ) : null}
          {benchmarkType !== "ftp" &&
          benchmarkType !== "hyrox_race" &&
          benchmarkType !== "squat" &&
          benchmarkType !== "deadlift" &&
          benchmarkType !== "bench" &&
          benchmarkType !== "military_press" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-zinc-400">
                Avg HR
                <input
                  className={fieldClass()}
                  value={avgHr}
                  onChange={(event) => setAvgHr(event.target.value)}
                  inputMode="numeric"
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-400">
                Max HR
                <input
                  className={fieldClass()}
                  value={maxHr}
                  onChange={(event) => setMaxHr(event.target.value)}
                  inputMode="numeric"
                />
              </label>
            </div>
          ) : null}
          <label className="block text-xs font-semibold text-zinc-400">
            Notes
            <textarea
              className={fieldClass()}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
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
  );

  return (
    <div className="space-y-6">
      {error && !payload ? <p className="text-sm text-amber-300/90">{error}</p> : null}
      <PerformanceExperience
        results={payload?.results ?? []}
        profile={payload?.profile}
        submitSlot={submitSlot}
      />
    </div>
  );
}
