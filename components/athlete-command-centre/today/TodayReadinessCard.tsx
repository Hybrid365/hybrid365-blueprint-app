"use client";

import { useCallback, useState } from "react";
import type { DailyReadinessInputs } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import { computeDailyReadinessScore } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { readOptionalReadinessFields } from "@/app/lib/hyrox-team/modules/home/optionalReadinessFields";
import { ReadinessRing } from "./ReadinessRing";

type Props = {
  readiness: HyroxDailyReadinessRow | null;
  saving?: boolean;
  disabled?: boolean;
  onSubmit: (input: DailyReadinessInputs & { timezone: string }) => Promise<boolean>;
};

const SCALE_FIELDS: Array<{
  key: keyof Pick<
    DailyReadinessInputs,
    "sleepQuality" | "energy" | "motivation" | "stress" | "muscleSoreness"
  >;
  label: string;
  hint: string;
}> = [
  { key: "sleepQuality", label: "Sleep quality", hint: "1 poor · 10 excellent" },
  { key: "energy", label: "Energy", hint: "1 drained · 10 charged" },
  { key: "motivation", label: "Motivation", hint: "1 low · 10 high" },
  { key: "stress", label: "Stress", hint: "1 calm · 10 high" },
  { key: "muscleSoreness", label: "Muscle soreness", hint: "1 none · 10 severe" },
];

function ScaleInput({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | "";
  disabled?: boolean;
  onChange: (n: number | "") => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-zinc-400">
        <span>{label}</span>
        <span className="font-normal text-[10px] text-zinc-600">{hint}</span>
      </span>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        disabled={disabled}
        value={value === "" ? 5 : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-yellow-400 disabled:opacity-50"
      />
      <span className="mt-0.5 block text-right text-sm font-bold tabular-nums text-white">
        {value === "" ? "—" : value}
      </span>
    </label>
  );
}

export function TodayReadinessCard({ readiness, saving, disabled, onSubmit }: Props) {
  const submitted = Boolean(readiness?.submitted_at);
  const optional = readOptionalReadinessFields(readiness);
  const [openForm, setOpenForm] = useState(!submitted);
  const [form, setForm] = useState({
    sleepQuality: (readiness?.sleep_quality ?? 6) as number | "",
    energy: (readiness?.energy ?? 6) as number | "",
    motivation: (readiness?.motivation ?? 6) as number | "",
    stress: (readiness?.stress ?? 4) as number | "",
    muscleSoreness: (readiness?.muscle_soreness ?? 4) as number | "",
    feelingUnwell: Boolean(readiness?.feeling_unwell),
    bodyweight: readiness?.bodyweight != null ? String(readiness.bodyweight) : "",
    restingHr: readiness?.resting_hr != null ? String(readiness.resting_hr) : "",
    sleepDuration: optional.sleepDurationMinutes != null ? String(optional.sleepDurationMinutes) : "",
    hrv: optional.hrv != null ? String(optional.hrv) : "",
    recoveryNotes: optional.recoveryNotes ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const preview = computeDailyReadinessScore({
    sleepQuality: form.sleepQuality === "" ? null : form.sleepQuality,
    energy: form.energy === "" ? null : form.energy,
    motivation: form.motivation === "" ? null : form.motivation,
    stress: form.stress === "" ? null : form.stress,
    muscleSoreness: form.muscleSoreness === "" ? null : form.muscleSoreness,
    feelingUnwell: form.feelingUnwell,
  });

  const handleSubmit = useCallback(async () => {
    setError(null);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const ok = await onSubmit({
      sleepQuality: form.sleepQuality === "" ? null : form.sleepQuality,
      energy: form.energy === "" ? null : form.energy,
      motivation: form.motivation === "" ? null : form.motivation,
      stress: form.stress === "" ? null : form.stress,
      muscleSoreness: form.muscleSoreness === "" ? null : form.muscleSoreness,
      feelingUnwell: form.feelingUnwell,
      bodyweight: form.bodyweight.trim() ? Number(form.bodyweight) : null,
      restingHr: form.restingHr.trim() ? Number(form.restingHr) : null,
      sleepDurationMinutes: form.sleepDuration.trim() ? Number(form.sleepDuration) : null,
      hrv: form.hrv.trim() ? Number(form.hrv) : null,
      recoveryNotes: form.recoveryNotes.trim() || null,
      timezone,
    });
    if (ok) setOpenForm(false);
    else setError("Could not save readiness. Try again.");
  }, [form, onSubmit]);

  const score = submitted ? readiness?.score ?? null : null;
  const category = submitted ? readiness?.category ?? null : null;
  const label = submitted
    ? category === "green"
      ? "Ready"
      : category === "red"
        ? "Recovery Priority"
        : "Manage Load"
    : "Not submitted";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ReadinessRing score={score} category={category} label={label} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Daily readiness
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">Morning check-in</h3>
          {submitted && readiness ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm leading-relaxed text-zinc-300">{readiness.explanation}</p>
              <p className="text-sm font-medium text-yellow-200/90">{readiness.coaching_prompt}</p>
              <p className="text-xs text-zinc-500">
                Your coach can now review today&apos;s readiness and session feedback. This indicator
                does not change your programme automatically.
              </p>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => setOpenForm((v) => !v)}
                  className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                >
                  {openForm ? "Hide update form" : "Update readiness"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              A short check-in so you and your coach know how ready you feel today.
            </p>
          )}
        </div>
      </div>

      {openForm && !disabled ? (
        <div className="mt-5 space-y-4 border-t border-zinc-800 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {SCALE_FIELDS.map((f) => (
              <ScaleInput
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={form[f.key]}
                disabled={saving}
                onChange={(n) => setForm((prev) => ({ ...prev, [f.key]: n }))}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.feelingUnwell}
              disabled={saving}
              onChange={(e) => setForm((p) => ({ ...p, feelingUnwell: e.target.checked }))}
              className="rounded border-zinc-600"
            />
            Illness / feeling unwell
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-zinc-400">
              Bodyweight (optional)
              <input
                type="text"
                inputMode="decimal"
                disabled={saving}
                value={form.bodyweight}
                onChange={(e) => setForm((p) => ({ ...p, bodyweight: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="kg"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-400">
              Resting HR (optional)
              <input
                type="text"
                inputMode="numeric"
                disabled={saving}
                value={form.restingHr}
                onChange={(e) => setForm((p) => ({ ...p, restingHr: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="bpm"
              />
            </label>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Optional recovery data
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Manual entry only — not synced with wearables.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-zinc-400">
                Sleep duration (optional)
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={saving}
                  value={form.sleepDuration}
                  onChange={(e) => setForm((p) => ({ ...p, sleepDuration: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                  placeholder="minutes"
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-400">
                HRV (optional)
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={saving}
                  value={form.hrv}
                  onChange={(e) => setForm((p) => ({ ...p, hrv: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                  placeholder="ms"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold text-zinc-400">
              Recovery notes (optional)
              <textarea
                disabled={saving}
                value={form.recoveryNotes}
                onChange={(e) => setForm((p) => ({ ...p, recoveryNotes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="Anything your coach should know"
              />
            </label>
          </div>
          {!submitted ? (
            <p className="text-xs text-zinc-500">
              Preview: {preview.label}
              {preview.score != null ? ` · ${preview.score}` : ""} — {preview.explanation}
            </p>
          ) : null}
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {saving ? "Saving…" : submitted ? "Update readiness" : "Submit readiness"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
