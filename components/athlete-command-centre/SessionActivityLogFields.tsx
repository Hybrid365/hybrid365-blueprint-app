"use client";

/**
 * Activity-specific session log fields for HYROX Team SessionDrawer.
 * Prescribed targets shown beside completed inputs where available.
 */

import { activityTypeLabel } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import type {
  ErgSessionMetrics,
  HyroxSessionMetrics,
  RunSessionMetrics,
  SessionActivityMetrics,
  SessionActivityType,
  SessionPlannedTargets,
  StrengthExerciseEntry,
  StrengthSessionMetrics,
} from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { emptyStrengthEntry } from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { buildPlannedCompletedPairs } from "@/app/lib/hyrox-team/modules/sessionPrescription/extensions";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-yellow-400/50 focus:outline-none disabled:opacity-50";

type Props = {
  activityType: SessionActivityType;
  planned: SessionPlannedTargets | null;
  metrics: SessionActivityMetrics;
  disabled?: boolean;
  onChange: (metrics: SessionActivityMetrics) => void;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-400">
      <span className="flex flex-wrap items-baseline justify-between gap-2">
        <span>{label}</span>
        {hint ? (
          <span className="font-normal text-[10px] text-zinc-500">Prescribed: {hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function PlannedVsCompleted({
  planned,
  metrics,
}: {
  planned: SessionPlannedTargets | null;
  metrics: SessionActivityMetrics;
}) {
  const m = metrics as Record<string, string | null | undefined>;
  const pairs = buildPlannedCompletedPairs({ planned, completed: m });
  if (pairs.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Planned vs completed
      </p>
      <ul className="mt-2 space-y-1.5">
        {pairs.map((p) => (
          <li key={p.key} className="grid grid-cols-3 gap-2 text-xs">
            <span className="text-zinc-500">{p.label}</span>
            <span className="text-zinc-400">{p.planned ?? "—"}</span>
            <span className="font-medium text-zinc-200">{p.completed?.trim() || "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SessionActivityLogFields({
  activityType,
  planned,
  metrics,
  disabled,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {activityTypeLabel(activityType)} metrics
      </p>
      <PlannedVsCompleted planned={planned} metrics={metrics} />
      {activityType === "run" ? (
        <RunFields
          planned={planned}
          metrics={metrics as RunSessionMetrics}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {activityType === "strength" ? (
        <StrengthFields
          metrics={metrics as StrengthSessionMetrics}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {activityType === "bike" || activityType === "row" || activityType === "ski" ? (
        <ErgFields
          planned={planned}
          metrics={metrics as ErgSessionMetrics}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {activityType === "hyrox" ? (
        <HyroxFields
          planned={planned}
          metrics={metrics as HyroxSessionMetrics}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {activityType === "other" ? (
        <OtherFields metrics={metrics as { duration?: string | null; rpe?: string | null; notes?: string | null }} disabled={disabled} onChange={onChange} />
      ) : null}
    </div>
  );
}

function RunFields({
  planned,
  metrics,
  disabled,
  onChange,
}: {
  planned: SessionPlannedTargets | null;
  metrics: RunSessionMetrics;
  disabled?: boolean;
  onChange: (m: SessionActivityMetrics) => void;
}) {
  const set = (key: keyof RunSessionMetrics, value: string) =>
    onChange({ ...metrics, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Distance (km)">
        <input className={inputClass} disabled={disabled} value={metrics.distanceKm ?? ""} onChange={(e) => set("distanceKm", e.target.value)} placeholder="e.g. 8.2" />
      </Field>
      <Field label="Duration" hint={planned?.estimatedDurationMinutes != null ? `${planned.estimatedDurationMinutes} min` : null}>
        <input className={inputClass} disabled={disabled} value={metrics.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="mm:ss or minutes" />
      </Field>
      <Field label="Average pace" hint={planned?.targetPace}>
        <input className={inputClass} disabled={disabled} value={metrics.averagePace ?? ""} onChange={(e) => set("averagePace", e.target.value)} placeholder="e.g. 4:45/km" />
      </Field>
      <Field label="Average HR" hint={planned?.targetHR}>
        <input className={inputClass} disabled={disabled} value={metrics.averageHr ?? ""} onChange={(e) => set("averageHr", e.target.value)} placeholder="bpm" />
      </Field>
      <Field label="Max HR">
        <input className={inputClass} disabled={disabled} value={metrics.maxHr ?? ""} onChange={(e) => set("maxHr", e.target.value)} placeholder="bpm" />
      </Field>
      <Field label="Cadence">
        <input className={inputClass} disabled={disabled} value={metrics.cadence ?? ""} onChange={(e) => set("cadence", e.target.value)} placeholder="spm" />
      </Field>
      <Field label="Elevation (m)">
        <input className={inputClass} disabled={disabled} value={metrics.elevationM ?? ""} onChange={(e) => set("elevationM", e.target.value)} />
      </Field>
      <Field label="Power (optional)">
        <input className={inputClass} disabled={disabled} value={metrics.powerW ?? ""} onChange={(e) => set("powerW", e.target.value)} placeholder="W" />
      </Field>
      <Field label="RPE" hint={planned?.targetRPE}>
        <input className={inputClass} disabled={disabled} value={metrics.rpe ?? ""} onChange={(e) => set("rpe", e.target.value)} placeholder="1–10" />
      </Field>
      <Field label="Pain / tightness">
        <input className={inputClass} disabled={disabled} value={metrics.painOrTightness ?? ""} onChange={(e) => set("painOrTightness", e.target.value)} />
      </Field>
      <div className="col-span-2">
        <Field label="Notes">
          <textarea className={inputClass} rows={2} disabled={disabled} value={metrics.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function StrengthFields({
  metrics,
  disabled,
  onChange,
}: {
  metrics: StrengthSessionMetrics;
  disabled?: boolean;
  onChange: (m: SessionActivityMetrics) => void;
}) {
  const exercises = metrics.exercises?.length ? metrics.exercises : [emptyStrengthEntry()];

  const updateExercise = (index: number, patch: Partial<StrengthExerciseEntry>) => {
    const next = exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex));
    onChange({ ...metrics, exercises: next });
  };

  return (
    <div className="space-y-3">
      {exercises.map((ex, i) => (
        <div key={i} className="rounded-lg border border-zinc-800 p-3 space-y-2">
          <Field label={`Exercise ${i + 1}`}>
            <input
              className={inputClass}
              disabled={disabled}
              value={ex.exercise}
              onChange={(e) => updateExercise(i, { exercise: e.target.value })}
              placeholder="e.g. Back squat"
            />
          </Field>
          <div className="grid grid-cols-4 gap-2">
            <Field label="Sets">
              <input className={inputClass} disabled={disabled} value={ex.sets ?? ""} onChange={(e) => updateExercise(i, { sets: e.target.value })} />
            </Field>
            <Field label="Reps">
              <input className={inputClass} disabled={disabled} value={ex.reps ?? ""} onChange={(e) => updateExercise(i, { reps: e.target.value })} />
            </Field>
            <Field label="Load">
              <input className={inputClass} disabled={disabled} value={ex.load ?? ""} onChange={(e) => updateExercise(i, { load: e.target.value })} />
            </Field>
            <Field label="RPE/RIR">
              <input className={inputClass} disabled={disabled} value={ex.rpeOrRir ?? ""} onChange={(e) => updateExercise(i, { rpeOrRir: e.target.value })} />
            </Field>
          </div>
          <Field label="Exercise notes">
            <input className={inputClass} disabled={disabled} value={ex.notes ?? ""} onChange={(e) => updateExercise(i, { notes: e.target.value })} />
          </Field>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ ...metrics, exercises: [...exercises, emptyStrengthEntry()] })}
        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
      >
        + Add exercise
      </button>
      <Field label="Session RPE">
        <input
          className={inputClass}
          disabled={disabled}
          value={metrics.sessionRpe ?? ""}
          onChange={(e) => onChange({ ...metrics, sessionRpe: e.target.value })}
          placeholder="1–10"
        />
      </Field>
      <Field label="Session notes">
        <textarea
          className={inputClass}
          rows={2}
          disabled={disabled}
          value={metrics.notes ?? ""}
          onChange={(e) => onChange({ ...metrics, notes: e.target.value })}
        />
      </Field>
    </div>
  );
}

function ErgFields({
  planned,
  metrics,
  disabled,
  onChange,
}: {
  planned: SessionPlannedTargets | null;
  metrics: ErgSessionMetrics;
  disabled?: boolean;
  onChange: (m: SessionActivityMetrics) => void;
}) {
  const set = (key: keyof ErgSessionMetrics, value: string) =>
    onChange({ ...metrics, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Distance">
        <input className={inputClass} disabled={disabled} value={metrics.distance ?? ""} onChange={(e) => set("distance", e.target.value)} placeholder="m or km" />
      </Field>
      <Field label="Duration" hint={planned?.estimatedDurationMinutes != null ? `${planned.estimatedDurationMinutes} min` : null}>
        <input className={inputClass} disabled={disabled} value={metrics.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="mm:ss" />
      </Field>
      <Field label="Pace / split" hint={planned?.targetPace ?? planned?.targetSplit}>
        <input className={inputClass} disabled={disabled} value={metrics.paceOrSplit ?? ""} onChange={(e) => set("paceOrSplit", e.target.value)} />
      </Field>
      <Field label="Watts">
        <input className={inputClass} disabled={disabled} value={metrics.watts ?? ""} onChange={(e) => set("watts", e.target.value)} />
      </Field>
      <Field label="Calories">
        <input className={inputClass} disabled={disabled} value={metrics.calories ?? ""} onChange={(e) => set("calories", e.target.value)} />
      </Field>
      <Field label="Average HR" hint={planned?.targetHR}>
        <input className={inputClass} disabled={disabled} value={metrics.averageHr ?? ""} onChange={(e) => set("averageHr", e.target.value)} />
      </Field>
      <Field label="Max HR">
        <input className={inputClass} disabled={disabled} value={metrics.maxHr ?? ""} onChange={(e) => set("maxHr", e.target.value)} />
      </Field>
      <Field label="Cadence / stroke rate">
        <input className={inputClass} disabled={disabled} value={metrics.cadenceOrStrokeRate ?? ""} onChange={(e) => set("cadenceOrStrokeRate", e.target.value)} />
      </Field>
      <Field label="RPE" hint={planned?.targetRPE}>
        <input className={inputClass} disabled={disabled} value={metrics.rpe ?? ""} onChange={(e) => set("rpe", e.target.value)} />
      </Field>
      <div className="col-span-2">
        <Field label="Notes">
          <textarea className={inputClass} rows={2} disabled={disabled} value={metrics.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function HyroxFields({
  planned,
  metrics,
  disabled,
  onChange,
}: {
  planned: SessionPlannedTargets | null;
  metrics: HyroxSessionMetrics;
  disabled?: boolean;
  onChange: (m: SessionActivityMetrics) => void;
}) {
  const set = (key: keyof HyroxSessionMetrics, value: string) =>
    onChange({ ...metrics, [key]: value });

  return (
    <div className="space-y-3">
      <Field label="Total duration" hint={planned?.estimatedDurationMinutes != null ? `${planned.estimatedDurationMinutes} min` : null}>
        <input className={inputClass} disabled={disabled} value={metrics.totalDuration ?? ""} onChange={(e) => set("totalDuration", e.target.value)} placeholder="e.g. 1:08:42" />
      </Field>
      <Field label="Run splits">
        <textarea className={inputClass} rows={2} disabled={disabled} value={metrics.runSplits ?? ""} onChange={(e) => set("runSplits", e.target.value)} placeholder="One split per line or comma-separated" />
      </Field>
      <Field label="Station splits">
        <textarea className={inputClass} rows={2} disabled={disabled} value={metrics.stationSplits ?? ""} onChange={(e) => set("stationSplits", e.target.value)} placeholder="Ski, Sled Push, …" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Limiting station">
          <input className={inputClass} disabled={disabled} value={metrics.limitingStation ?? ""} onChange={(e) => set("limitingStation", e.target.value)} />
        </Field>
        <Field label="Strongest station">
          <input className={inputClass} disabled={disabled} value={metrics.strongestStation ?? ""} onChange={(e) => set("strongestStation", e.target.value)} />
        </Field>
      </div>
      <Field label="RPE" hint={planned?.targetRPE}>
        <input className={inputClass} disabled={disabled} value={metrics.rpe ?? ""} onChange={(e) => set("rpe", e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className={inputClass} rows={2} disabled={disabled} value={metrics.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </div>
  );
}

function OtherFields({
  metrics,
  disabled,
  onChange,
}: {
  metrics: { duration?: string | null; rpe?: string | null; notes?: string | null };
  disabled?: boolean;
  onChange: (m: SessionActivityMetrics) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Duration">
        <input
          className={inputClass}
          disabled={disabled}
          value={metrics.duration ?? ""}
          onChange={(e) => onChange({ ...metrics, duration: e.target.value })}
        />
      </Field>
      <Field label="RPE">
        <input
          className={inputClass}
          disabled={disabled}
          value={metrics.rpe ?? ""}
          onChange={(e) => onChange({ ...metrics, rpe: e.target.value })}
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={2}
          disabled={disabled}
          value={metrics.notes ?? ""}
          onChange={(e) => onChange({ ...metrics, notes: e.target.value })}
        />
      </Field>
    </div>
  );
}
