"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { ProgrammePreviewApiResponse } from "@/app/api/internal/programme-preview/route";
import type { ProgrammePreviewAnalysis } from "@/app/lib/internalProgrammePreviewAnalysis";
import {
  PROGRAMME_PREVIEW_PRESETS,
  type ProgrammePreviewFormState,
  type PreviewPresetId,
} from "@/app/lib/internalProgrammePreviewPresets";
import { RUN_VOLUME_BAND_OPTIONS } from "@/app/lib/runVolumePlanner";
import type { GeneratedProgrammeWeek } from "@/app/lib/generate12WeekProgramme";
import type { DayPlan } from "@/app/lib/sessionLibrary";

const WEEKLY_BANDS = ["2-3", "3-5", "5-7", "7-10", "10+"] as const;

type Props = {
  userEmail: string;
  adminListConfigured: boolean;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30";

function SessionCard({ day }: { day: DayPlan }) {
  const rx = day.run_prescription;
  const ds = day.double_session;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-yellow-500/90">
            {day.day}
          </span>
          <h4 className="text-base font-semibold text-white">{day.title}</h4>
        </div>
        {day.time_cap_minutes ? (
          <span className="text-xs text-zinc-500">{day.time_cap_minutes} min</span>
        ) : null}
      </div>
      {day.intent ? <p className="mt-2 text-sm text-zinc-400">{day.intent}</p> : null}
      {day.tags?.length ? (
        <p className="mt-1 text-xs text-zinc-600">{day.tags.join(" · ")}</p>
      ) : null}
      {day.progression_marker ? (
        <p className="mt-2 text-xs text-zinc-500">
          {[
            day.progression_family,
            day.progression_marker.threshold_total_minutes &&
              `threshold ${day.progression_marker.threshold_total_minutes} min`,
            day.progression_marker.long_run_minutes &&
              `long ${day.progression_marker.long_run_minutes} min`,
            day.progression_marker.hyrox_station_density &&
              `station density ${day.progression_marker.hyrox_station_density}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      {rx ? (
        <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm">
          <p className="font-medium text-yellow-400/90">Run prescription</p>
          {rx.pace_range ? <p className="text-zinc-300">Pace: {rx.pace_range}</p> : null}
          {rx.hr_range ? <p className="text-zinc-300">HR: {rx.hr_range}</p> : null}
          <p className="text-zinc-300">{rx.rpe}</p>
          <p className="mt-1 text-zinc-400">{rx.coach_note}</p>
        </div>
      ) : null}
      {day.session?.main?.length ? (
        <ul className="mt-3 space-y-1 text-sm text-zinc-300">
          {day.session.main.slice(0, 6).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-yellow-500">·</span>
              <span>{line}</span>
            </li>
          ))}
          {day.session.main.length > 6 ? (
            <li className="text-xs text-zinc-600">+{day.session.main.length - 6} more lines</li>
          ) : null}
        </ul>
      ) : null}
      {day.session?.notes?.length ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {day.session.notes.slice(0, 2).join(" ")}
        </p>
      ) : null}
      {ds?.enabled && ds.secondary ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="text-xs font-semibold text-blue-400">{ds.label ?? "Double session"}</p>
          {ds.double_session_intent ? (
            <p className="text-xs text-zinc-500">
              {ds.double_session_intent.replace(/_/g, " ")}
              {ds.modality ? ` · ${ds.modality}` : ""}
              {ds.threshold_minutes ? ` · ${ds.threshold_minutes} min thr` : ""}
              {ds.is_optional ? " · optional" : ""}
            </p>
          ) : null}
          <p className="text-sm text-white">{ds.secondary.title}</p>
        </div>
      ) : null}
    </div>
  );
}

function QaSummaryTable({ analysis }: { analysis: ProgrammePreviewAnalysis }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Wk</th>
            <th className="px-3 py-2">Focus</th>
            <th className="px-3 py-2">Dbl phase</th>
            <th className="px-3 py-2">Dbls</th>
            <th className="px-3 py-2">Aer+</th>
            <th className="px-3 py-2">Thr+Z2</th>
            <th className="px-3 py-2">Dbl thr</th>
            <th className="px-3 py-2">Runs</th>
            <th className="px-3 py-2">Run thr</th>
            <th className="px-3 py-2">Erg</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Hard</th>
            <th className="px-3 py-2">Long</th>
            <th className="px-3 py-2">~km</th>
            <th className="px-3 py-2">HYROX</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {analysis.weeks.map((w) => (
            <tr key={w.week_number} className="bg-zinc-950/50">
              <td className="px-3 py-2 font-medium text-white">{w.week_number}</td>
              <td className="px-3 py-2 text-zinc-400">{w.week_focus.replace(/_/g, " ")}</td>
              <td className="px-3 py-2 text-zinc-500" title={w.selected_double_days.join(", ")}>
                {w.double_session_phase?.replace(/_/g, " ") ?? "—"}
              </td>
              <td className="px-3 py-2">{w.double_count || "—"}</td>
              <td className="px-3 py-2">{w.aerobic_double_count || "—"}</td>
              <td className="px-3 py-2">{w.threshold_plus_aerobic_count || "—"}</td>
              <td
                className={`px-3 py-2 ${w.double_threshold_count > 1 ? "text-amber-400" : ""}`}
              >
                {w.double_threshold_count || "—"}
              </td>
              <td className="px-3 py-2">{w.run_exposures}</td>
              <td
                className={`px-3 py-2 ${!w.run_anchor_present && analysis.hyrox_track ? "text-amber-400" : ""}`}
                title={w.run_anchor_title ?? "no run anchor"}
              >
                {w.run_threshold_minutes > 0 ? w.run_threshold_minutes : "—"}
              </td>
              <td className="px-3 py-2" title={w.erg_support_present ? "erg support" : ""}>
                {w.erg_threshold_minutes > 0 ? w.erg_threshold_minutes : "—"}
              </td>
              <td className="px-3 py-2">{w.total_threshold_minutes > 0 ? w.total_threshold_minutes : "—"}</td>
              <td
                className={`px-3 py-2 ${w.max_consecutive_hard >= 3 ? "text-amber-400" : ""}`}
                title={w.hard_days.join(", ")}
              >
                {w.hard_day_count}
                {w.max_consecutive_hard >= 3 ? ` (${w.max_consecutive_hard}↯)` : ""}
              </td>
              <td className="px-3 py-2">
                {w.long_run_present ? (w.long_run_minutes ? `${w.long_run_minutes}m` : "Yes") : "—"}
              </td>
              <td className="px-3 py-2">{w.estimated_run_km ?? "—"}</td>
              <td className="px-3 py-2 text-zinc-400">
                {w.compromised_sessions > 0 ? w.compromised_sessions : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekDetail({ week }: { week: GeneratedProgrammeWeek }) {
  const pj = week.plan_json;
  const rationale = pj.week_rationale;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{week.title}</h3>
        <p className="text-sm text-zinc-500">
          Block {week.block_number} · {pj.week_context?.week_focus?.replace(/_/g, " ") ?? "—"}
        </p>
      </div>

      {rationale ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-yellow-400">Week coaching</p>
          <p className="text-sm text-zinc-300">{rationale.why_this_week_matters}</p>
          <p className="text-sm text-zinc-400">{rationale.coach_note}</p>
          {rationale.progression_focus ? (
            <p className="text-xs text-zinc-500">{rationale.progression_focus}</p>
          ) : null}
          {rationale.key_sessions_to_prioritise?.length ? (
            <ul className="text-sm text-zinc-400 list-disc pl-5">
              {rationale.key_sessions_to_prioritise.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {pj.schedule.map((day) => (
          <SessionCard key={`${day.day}-${day.title}`} day={day} />
        ))}
      </div>
    </div>
  );
}

export default function ProgrammePreviewClient({ userEmail, adminListConfigured }: Props) {
  const [form, setForm] = useState<ProgrammePreviewFormState>(
    PROGRAMME_PREVIEW_PRESETS[0]!.form
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProgrammePreviewApiResponse | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const loadPreset = useCallback((id: PreviewPresetId) => {
    const preset = PROGRAMME_PREVIEW_PRESETS.find((p) => p.id === id);
    if (preset) setForm({ ...preset.form });
    setResult(null);
    setError(null);
  }, []);

  const update = useCallback(
    <K extends keyof ProgrammePreviewFormState>(key: K, value: ProgrammePreviewFormState[K]) => {
      setForm((f) => ({ ...f, presetId: "custom", [key]: value }));
    },
    []
  );

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/programme-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const data = (await res.json()) as ProgrammePreviewApiResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      setSelectedWeek(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedWeekData = result?.weeks.find((w) => w.week_number === selectedWeek);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
              Internal QA
            </p>
            <h1 className="text-2xl font-bold text-white">12-Week Programme Preview</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Preview-only · not saved to database · {userEmail}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              Preview mode
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Dashboard →
            </Link>
          </div>
        </div>
        {!adminListConfigured ? (
          <p className="mx-auto mt-3 max-w-7xl text-xs text-amber-400/90">
            INTERNAL_ADMIN_EMAILS is not set — any signed-in user can access. Set a comma-separated
            list in production.
          </p>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Preset profiles
          </h2>
          <div className="flex flex-wrap gap-2">
            {PROGRAMME_PREVIEW_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => loadPreset(p.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  form.presetId === p.id
                    ? "border-yellow-500/50 bg-yellow-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className="font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Editable inputs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Goal">
              <input
                className={inputClass}
                value={form.goal_focus}
                onChange={(e) => update("goal_focus", e.target.value)}
              />
            </Field>
            <Field label="Event">
              <input
                className={inputClass}
                value={form.event_type}
                onChange={(e) => update("event_type", e.target.value)}
              />
            </Field>
            <Field label="Event date (YYYY-MM-DD)">
              <input
                className={inputClass}
                value={form.event_date}
                onChange={(e) => update("event_date", e.target.value)}
              />
            </Field>
            <Field label="5km time">
              <input
                className={inputClass}
                value={form.five_k_time}
                onChange={(e) => update("five_k_time", e.target.value)}
                placeholder="e.g. 22:00"
              />
            </Field>
            <Field label="Max HR">
              <input
                className={inputClass}
                value={form.max_heart_rate}
                onChange={(e) => update("max_heart_rate", e.target.value)}
                placeholder="optional"
              />
            </Field>
            <Field label="Run volume band">
              <select
                className={inputClass}
                value={form.current_run_volume_band}
                onChange={(e) => update("current_run_volume_band", e.target.value)}
              >
                {RUN_VOLUME_BAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Days / week">
              <input
                type="number"
                min={2}
                max={7}
                className={inputClass}
                value={form.training_days_per_week}
                onChange={(e) =>
                  update("training_days_per_week", Number(e.target.value) || 5)
                }
              />
            </Field>
            <Field label="Weekly hours band">
              <select
                className={inputClass}
                value={form.weekly_hours_band}
                onChange={(e) => update("weekly_hours_band", e.target.value)}
              >
                {WEEKLY_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Strength experience">
              <input
                className={inputClass}
                value={form.strength_experience}
                onChange={(e) => update("strength_experience", e.target.value)}
              />
            </Field>
            <Field label="Equipment (comma-separated)">
              <input
                className={inputClass}
                value={form.equipment}
                onChange={(e) => update("equipment", e.target.value)}
              />
            </Field>
            <Field label="Biggest limiter">
              <input
                className={inputClass}
                value={form.biggest_limiter}
                onChange={(e) => update("biggest_limiter", e.target.value)}
              />
            </Field>
            <Field label="Notes">
              <input
                className={inputClass}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
            <Field label="Injury flags">
              <input
                className={inputClass}
                value={form.injury_flags}
                onChange={(e) => update("injury_flags", e.target.value)}
              />
            </Field>
            <Field label="Double session days">
              <input
                className={inputClass}
                value={form.double_session_days}
                onChange={(e) => update("double_session_days", e.target.value)}
                placeholder="Tue, Thu"
                disabled={!form.double_sessions}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.double_sessions}
              onChange={(e) => update("double_sessions", e.target.checked)}
              className="rounded border-zinc-600"
            />
            Double sessions enabled
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate 12-week preview"}
          </button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </section>

        {result ? (
          <>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                QA summary
              </h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                  Ability: <strong className="text-white">{result.input_summary.ability_level}</strong>
                </span>
                <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                  Goal: <strong className="text-white">{result.input_summary.goal_focus}</strong>
                </span>
                <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                  HYROX track:{" "}
                  <strong className="text-white">
                    {result.analysis.hyrox_track ? "Yes" : "No"}
                  </strong>
                </span>
                <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                  Locked weeks: <strong className="text-zinc-500">N/A (preview)</strong>
                </span>
                {result.analysis.athlete_double_days.length > 0 ? (
                  <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
                    Double days:{" "}
                    <strong className="text-white">
                      {result.analysis.athlete_double_days.join(", ")}
                    </strong>
                  </span>
                ) : null}
              </div>
              <QaSummaryTable analysis={result.analysis} />
              {result.analysis.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-semibold text-amber-300">Warnings ({result.analysis.warnings.length})</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-200/90">
                    {result.analysis.warnings.map((w) => (
                      <li key={w}>· {w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-emerald-400/90">No automated warnings for this preview.</p>
              )}
            </section>

            {result.weeks[0]?.plan_json.programme_rationale ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                <h2 className="text-lg font-bold text-white">
                  {result.weeks[0].plan_json.programme_rationale.headline}
                </h2>
                {result.weeks[0].plan_json.programme_rationale.summary.map((s) => (
                  <p key={s} className="text-sm text-zinc-400">
                    {s}
                  </p>
                ))}
                {result.weeks[0].plan_json.programme_intelligence ? (
                  <p className="text-xs text-zinc-600">
                    Intelligence: {result.weeks[0].plan_json.programme_intelligence.primary_goal} ·{" "}
                    {result.weeks[0].plan_json.programme_intelligence.limiter_focus}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {result.weeks.map((w) => (
                  <button
                    key={w.week_number}
                    type="button"
                    onClick={() => setSelectedWeek(w.week_number)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      selectedWeek === w.week_number
                        ? "bg-yellow-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    W{w.week_number}
                  </button>
                ))}
              </div>
              {selectedWeekData ? <WeekDetail week={selectedWeekData} /> : null}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
