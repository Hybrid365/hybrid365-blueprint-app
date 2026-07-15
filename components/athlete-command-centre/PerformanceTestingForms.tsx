"use client";

import { useCallback, useState } from "react";
import { performanceTestingApiBase } from "@/app/lib/hyroxPerformanceTestingApiConfig";
import type { PerformanceTestingViewMode } from "@/app/lib/hyroxPerformanceTestingApiConfig";
import {
  PERFORMANCE_TEST_DEFINITIONS,
  RECOVERY_BASELINE_COPY,
  defaultResultJsonForType,
  type PerformanceTestResultRow,
  type PerformanceTestType,
  type RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";

type RecoveryBaselineFormProps = {
  baseline: RecoveryBaselineRow | null;
  testWeekId: string;
  onSaved: (baseline: RecoveryBaselineRow) => void;
  mode?: PerformanceTestingViewMode;
  athleteId?: string;
  readOnly?: boolean;
  showCoachSaveNote?: boolean;
};

export function RecoveryBaselineForm({
  baseline,
  testWeekId,
  onSaved,
  mode = "athlete",
  athleteId,
  readOnly = false,
  showCoachSaveNote = false,
}: RecoveryBaselineFormProps) {
  const [restingHr, setRestingHr] = useState(
    baseline?.resting_hr_baseline != null ? String(baseline.resting_hr_baseline) : ""
  );
  const [baselineDays, setBaselineDays] = useState(
    baseline?.baseline_days != null ? String(baseline.baseline_days) : "7"
  );
  const [averageHrv, setAverageHrv] = useState(
    baseline?.average_hrv != null ? String(baseline.average_hrv) : ""
  );
  const [averageSleep, setAverageSleep] = useState(
    baseline?.average_sleep_minutes != null ? String(baseline.average_sleep_minutes) : ""
  );
  const [averageSteps, setAverageSteps] = useState(
    baseline?.average_daily_steps != null ? String(baseline.average_daily_steps) : ""
  );
  const [averageTrainingHours, setAverageTrainingHours] = useState(
    baseline?.average_training_hours != null ? String(baseline.average_training_hours) : ""
  );
  const [deviceSource, setDeviceSource] = useState(baseline?.device_source ?? "");
  const [notes, setNotes] = useState(baseline?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    if (readOnly) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const apiBase = performanceTestingApiBase(mode, athleteId);
      const res = await fetch(apiBase, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_baseline",
          testWeekId,
          restingHrBaseline: Number(restingHr),
          baselineDays: Number(baselineDays),
          averageHrv: averageHrv ? Number(averageHrv) : null,
          averageSleepMinutes: averageSleep ? Number(averageSleep) : null,
          averageDailySteps: averageSteps ? Number(averageSteps) : null,
          averageTrainingHours: averageTrainingHours ? Number(averageTrainingHours) : null,
          deviceSource,
          notes,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        baseline?: RecoveryBaselineRow;
        error?: string;
      };
      if (!res.ok || !json.success || !json.baseline) {
        throw new Error(json.error ?? "Could not save recovery baseline.");
      }
      onSaved(json.baseline);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [
    averageHrv,
    averageSleep,
    averageSteps,
    averageTrainingHours,
    baselineDays,
    deviceSource,
    notes,
    onSaved,
    readOnly,
    restingHr,
    testWeekId,
    mode,
    athleteId,
  ]);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-zinc-400">{RECOVERY_BASELINE_COPY}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Average resting HR (required)</span>
          <input
            type="number"
            value={restingHr}
            onChange={(e) => setRestingHr(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
            placeholder="e.g. 52"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Days used in baseline (7–10)</span>
          <input
            type="number"
            min={7}
            max={10}
            value={baselineDays}
            onChange={(e) => setBaselineDays(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Average HRV (optional)</span>
          <input
            type="number"
            value={averageHrv}
            onChange={(e) => setAverageHrv(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Average sleep (minutes, optional)</span>
          <input
            type="number"
            value={averageSleep}
            onChange={(e) => setAverageSleep(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Average daily steps (optional)</span>
          <input
            type="number"
            value={averageSteps}
            onChange={(e) => setAverageSteps(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Average weekly training hours (optional)</span>
          <input
            type="number"
            step="0.5"
            value={averageTrainingHours}
            onChange={(e) => setAverageTrainingHours(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-zinc-300">Device / source (optional)</span>
          <input
            type="text"
            value={deviceSource}
            onChange={(e) => setDeviceSource(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
            placeholder="e.g. Whoop, Garmin, Oura"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-zinc-300">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={readOnly}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-300">Recovery baseline saved.</p> : null}
      {showCoachSaveNote && !readOnly ? (
        <p className="text-xs text-amber-200/80">
          Saving in Coach Preview will update this athlete&apos;s real testing record.
        </p>
      ) : null}
      <button
        type="button"
        disabled={saving || readOnly}
        onClick={() => void save()}
        className="rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save recovery baseline"}
      </button>
    </div>
  );
}

export type PerformanceTestSavePayload = {
  testType: PerformanceTestType;
  status: "draft" | "submitted";
  resultJson: Record<string, unknown>;
  notes?: string;
  videoUrl?: string;
  proofUrl?: string;
};

type PerformanceTestResultFormProps = {
  testType: PerformanceTestType;
  existing: PerformanceTestResultRow | null;
  programmeWeekId: string | null;
  testWeekId: string;
  locked?: boolean;
  readOnly?: boolean;
  mode?: PerformanceTestingViewMode;
  athleteId?: string;
  showCoachSaveNote?: boolean;
  onSaved: (result: PerformanceTestResultRow) => void;
};

export function PerformanceTestResultForm({
  testType,
  existing,
  programmeWeekId,
  testWeekId,
  locked = false,
  readOnly = false,
  mode = "athlete",
  athleteId,
  showCoachSaveNote = false,
  onSaved,
}: PerformanceTestResultFormProps) {
  const def = PERFORMANCE_TEST_DEFINITIONS[testType];
  const [open, setOpen] = useState(false);
  const [resultJson, setResultJson] = useState<Record<string, unknown>>(
    existing?.result_json && Object.keys(existing.result_json).length > 0
      ? existing.result_json
      : defaultResultJsonForType(testType)
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");
  const [proofUrl, setProofUrl] = useState(existing?.proof_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: string, value: unknown) => {
    setResultJson((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (status: "draft" | "submitted") => {
    if (readOnly || locked) return;
    setSaving(true);
    setError(null);
    try {
      const apiBase = performanceTestingApiBase(mode, athleteId);
      const res = await fetch(apiBase, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_result",
          testWeekId,
          programmeWeekId,
          testType,
          status,
          resultJson,
          notes,
          videoUrl,
          proofUrl,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        result?: PerformanceTestResultRow;
        error?: string;
      };
      if (!res.ok || !json.success || !json.result) {
        throw new Error(json.error ?? "Could not save result.");
      }
      onSaved(json.result);
      if (status === "submitted") setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: (typeof def.requiredFields)[number] | (typeof def.optionalFields)[number]) => {
    const value = resultJson[field.key];

    if (field.type === "boolean") {
      return (
        <label key={field.key} className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={locked || readOnly}
            onChange={(e) => updateField(field.key, e.target.checked)}
            className="rounded border-zinc-600"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            {field.label}
            {field.required ? " *" : ""}
          </span>
          <select
            value={String(value ?? "")}
            disabled={locked || readOnly}
            onChange={(e) => updateField(field.key, e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            {field.label}
            {field.required ? " *" : ""}
          </span>
          <textarea
            value={String(value ?? "")}
            disabled={locked || readOnly}
            onChange={(e) => updateField(field.key, e.target.value)}
            rows={3}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
      );
    }

    return (
      <label key={field.key} className="block text-sm">
        <span className="mb-1 block text-zinc-300">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <input
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          disabled={locked || readOnly}
          onChange={(e) => updateField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
        />
      </label>
    );
  };

  const renderCompromisedRounds = () => {
    const rounds = Array.isArray(resultJson.rounds)
      ? (resultJson.rounds as Array<Record<string, unknown>>)
      : [];

    return (
      <div className="space-y-4">
        {rounds.map((round, index) => (
          <div key={index} className="rounded-xl border border-zinc-800 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-yellow-400/80">
              Round {index + 1}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["runSplit", "Run split"],
                ["sledPushSplit", "Sled push"],
                ["sledPullSplit", "Sled pull"],
                ["burpeeResult", "Burpee result"],
                ["totalRoundTime", "Total round time"],
                ["recoveryDuration", "Recovery duration"],
                ["rpe", "RPE"],
              ].map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-zinc-400">{label}</span>
                  <input
                    type="text"
                    disabled={locked || readOnly}
                    value={String(round[key] ?? "")}
                    onChange={(e) => {
                      const next = [...rounds];
                      next[index] = { ...next[index], [key]: e.target.value };
                      updateField("rounds", next);
                    }}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-white"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        {!locked && !readOnly ? (
          <button
            type="button"
            onClick={() =>
              updateField("rounds", [
                ...rounds,
                {
                  roundNumber: rounds.length + 1,
                  runSplit: "",
                  sledPushSplit: "",
                  sledPullSplit: "",
                  burpeeResult: "",
                  totalRoundTime: "",
                  recoveryDuration: "",
                  rpe: "",
                },
              ])
            }
            className="text-xs font-semibold text-yellow-300"
          >
            + Add round
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{def.title}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {existing?.status === "reviewed" || existing?.coach_reviewed
              ? "Coach reviewed"
              : existing?.status === "submitted"
                ? "Submitted"
                : existing?.status === "draft"
                  ? "Draft saved"
                  : "Not started"}
          </p>
        </div>
        {!locked && !readOnly ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-yellow-500/40 px-3 py-1 text-xs font-bold text-yellow-200"
          >
            {open ? "Close" : existing ? "Edit results" : "Open test"}
          </button>
        ) : null}
      </div>

      {def.safetyNote ? (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-400/5 p-3 text-xs text-amber-100/90">
          {def.safetyNote}
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-4">
          <ul className="list-inside list-disc text-xs text-zinc-500">
            {def.protocol.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {def.videoPrompt ? (
            <p className="text-xs text-zinc-400">{def.videoPrompt}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {def.requiredFields.map(renderField)}
            {def.optionalFields.map(renderField)}
          </div>
          {testType === "compromised_sled_run" ? renderCompromisedRounds() : null}
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Notes</span>
            <textarea
              value={notes}
              disabled={locked || readOnly}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Video URL</span>
              <input
                type="url"
                value={videoUrl}
                disabled={locked || readOnly}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Proof URL</span>
              <input
                type="url"
                value={proofUrl}
                disabled={locked || readOnly}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white disabled:opacity-60"
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {showCoachSaveNote && !readOnly ? (
            <p className="text-xs text-amber-200/80">
              Saving in Coach Preview will update this athlete&apos;s real testing record.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || locked || readOnly}
              onClick={() => void save("draft")}
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving || locked || readOnly}
              onClick={() => void save("submitted")}
              className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              Submit result
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
