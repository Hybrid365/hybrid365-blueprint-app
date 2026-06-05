"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Flag,
  Play,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HYROX_EQUIPMENT_OPTIONS,
  HYROX_STATION_WEAKNESS_OPTIONS,
  SLED_EXPERIENCE_OPTIONS,
  TRAINING_TRACK_OPTIONS,
  type HyroxEquipmentAccess,
  type HyroxStationWeakness,
  type SledPushPullExperience,
} from "@/app/lib/communityHyroxAssessment";
import { analyseCommunityProgrammePreview } from "@/app/lib/communityProgrammePreview/analysePreview";
import {
  DEFAULT_PREVIEW_INPUT,
  generateCommunityProgrammePreview,
} from "@/app/lib/communityProgrammePreview/generatePreview";
import type {
  CommunityPreviewInput,
  CommunityProgrammePreview,
  CommunityPreviewQaReport,
  PreviewAbilityLevel,
  PreviewSession,
  QaCheckStatus,
} from "@/app/lib/communityProgrammePreview/types";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-yellow-400 text-zinc-950"
          : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/30";

function stressBadge(stress: PreviewSession["stress"]) {
  const map = {
    easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    moderate: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    hard: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return map[stress];
}

function QaIcon({ status }: { status: QaCheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />;
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
}

export default function CommunityProgrammePreviewClient() {
  const [input, setInput] = useState<CommunityPreviewInput>(DEFAULT_PREVIEW_INPUT);
  const [preview, setPreview] = useState<CommunityProgrammePreview | null>(null);
  const [qa, setQa] = useState<CommunityPreviewQaReport | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const isHyrox = input.training_track === "hyrox";
  const week = preview?.weeks.find((w) => w.week_number === selectedWeek);

  const toggleWeakness = (w: HyroxStationWeakness) => {
    setInput((prev) => {
      const has = prev.station_weaknesses.includes(w);
      if (has) {
        return { ...prev, station_weaknesses: prev.station_weaknesses.filter((x) => x !== w) };
      }
      if (prev.station_weaknesses.length >= 3) return prev;
      return { ...prev, station_weaknesses: [...prev.station_weaknesses, w] };
    });
  };

  const toggleEquipment = (e: HyroxEquipmentAccess) => {
    setInput((prev) => ({
      ...prev,
      hyrox_equipment: prev.hyrox_equipment.includes(e)
        ? prev.hyrox_equipment.filter((x) => x !== e)
        : [...prev.hyrox_equipment, e],
    }));
  };

  function generate() {
    const result = generateCommunityProgrammePreview(input);
    setPreview(result);
    setQa(analyseCommunityProgrammePreview(result, input));
    setSelectedWeek(1);
  }

  const qaByCategory = useMemo(() => {
    if (!qa) return [];
    const groups = new Map<string, typeof qa.checks>();
    for (const c of qa.checks) {
      const list = groups.get(c.category) ?? [];
      list.push(c);
      groups.set(c.category, list);
    }
    return Array.from(groups.entries());
  }, [qa]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link
          href="/admin/hyrox-athletes"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
              Admin · Preview only
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Community Programme Preview</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              QA paid community programming for Hybrid Performance and HYROX Specific tracks. Generates
              in-memory only — nothing is written to programme_instances or programme_weeks.
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
          >
            <Play className="h-4 w-4" />
            Generate Preview
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Input panel */}
          <aside className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-semibold text-white">Preview inputs</h2>

            <Field label="Training track">
              <div className="flex flex-wrap gap-2">
                {TRAINING_TRACK_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={input.training_track === opt.value}
                    onClick={() => setInput((p) => ({ ...p, training_track: opt.value }))}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Ability level">
              <div className="flex flex-wrap gap-2">
                {(["beginner", "intermediate", "advanced"] as PreviewAbilityLevel[]).map((lvl) => (
                  <Pill
                    key={lvl}
                    active={input.ability_level === lvl}
                    onClick={() => setInput((p) => ({ ...p, ability_level: lvl }))}
                  >
                    {lvl}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Training days / week">
              <div className="flex flex-wrap gap-2">
                {([3, 4, 5, 6] as const).map((d) => (
                  <Pill
                    key={d}
                    active={input.training_days_per_week === d}
                    onClick={() => setInput((p) => ({ ...p, training_days_per_week: d }))}
                  >
                    {d} days
                  </Pill>
                ))}
              </div>
            </Field>

            {isHyrox ? (
              <Field label="Block number (phase)">
                <div className="flex flex-wrap gap-2">
                  {([1, 2, 3, 4] as const).map((b) => (
                    <Pill
                      key={b}
                      active={input.block_number === b}
                      onClick={() => setInput((p) => ({ ...p, block_number: b }))}
                    >
                      Block {b}
                    </Pill>
                  ))}
                </div>
              </Field>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Weekly hours">
                <input
                  className={inputClass}
                  value={input.weekly_training_hours}
                  onChange={(e) => setInput((p) => ({ ...p, weekly_training_hours: e.target.value }))}
                />
              </Field>
              <Field label="Session length">
                <input
                  className={inputClass}
                  value={input.session_length}
                  onChange={(e) => setInput((p) => ({ ...p, session_length: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Double sessions">
              <Pill
                active={input.double_session_availability}
                onClick={() =>
                  setInput((p) => ({ ...p, double_session_availability: !p.double_session_availability }))
                }
              >
                {input.double_session_availability ? "Yes" : "No"}
              </Pill>
            </Field>

            <Field label="Equipment access">
              <div className="flex flex-wrap gap-1.5">
                {(["Full Gym", "Home Gym", "Minimal Equipment", "Outdoor Only"] as const).map((opt) => (
                  <Pill
                    key={opt}
                    active={input.equipment_access.includes(opt)}
                    onClick={() =>
                      setInput((p) => ({
                        ...p,
                        equipment_access: p.equipment_access.includes(opt)
                          ? p.equipment_access.filter((x) => x !== opt)
                          : [...p.equipment_access, opt],
                      }))
                    }
                  >
                    {opt}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Injury / limitations">
              <textarea
                className={cn(inputClass, "min-h-[60px] resize-none")}
                value={input.injury_limitations}
                onChange={(e) => setInput((p) => ({ ...p, injury_limitations: e.target.value }))}
              />
            </Field>

            <div className="border-t border-zinc-800 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Running</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="5K time">
                  <input
                    className={inputClass}
                    value={input.current_5k_time}
                    onChange={(e) => setInput((p) => ({ ...p, current_5k_time: e.target.value }))}
                  />
                </Field>
                <Field label="10K time">
                  <input
                    className={inputClass}
                    value={input.current_10k_time}
                    onChange={(e) => setInput((p) => ({ ...p, current_10k_time: e.target.value }))}
                  />
                </Field>
                <Field label="Weekly run km">
                  <input
                    className={inputClass}
                    value={input.weekly_run_volume_km}
                    onChange={(e) => setInput((p) => ({ ...p, weekly_run_volume_km: e.target.value }))}
                  />
                </Field>
                <Field label="Running confidence (1–10)">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className={inputClass}
                    value={input.running_confidence ?? ""}
                    onChange={(e) =>
                      setInput((p) => ({
                        ...p,
                        running_confidence: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                </Field>
              </div>
            </div>

            {isHyrox ? (
              <div className="border-t border-zinc-800 pt-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  <Flag className="h-3.5 w-3.5" />
                  HYROX-specific
                </p>
                <div className="space-y-3">
                  <Field label="Race booked">
                    <input
                      className={inputClass}
                      value={input.race_booked}
                      onChange={(e) => setInput((p) => ({ ...p, race_booked: e.target.value }))}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Race date">
                      <input
                        type="date"
                        className={inputClass}
                        value={input.race_date}
                        onChange={(e) => setInput((p) => ({ ...p, race_date: e.target.value }))}
                      />
                    </Field>
                    <Field label="Category">
                      <input
                        className={inputClass}
                        value={input.race_category}
                        onChange={(e) => setInput((p) => ({ ...p, race_category: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field label="Target time">
                    <input
                      className={inputClass}
                      value={input.race_target_time}
                      onChange={(e) => setInput((p) => ({ ...p, race_target_time: e.target.value }))}
                    />
                  </Field>
                  <Field label="Station weaknesses (max 3)">
                    <div className="flex flex-wrap gap-1.5">
                      {HYROX_STATION_WEAKNESS_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={input.station_weaknesses.includes(opt.value)}
                          onClick={() => toggleWeakness(opt.value)}
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </Field>
                  <Field label="HYROX equipment">
                    <div className="flex flex-wrap gap-1.5">
                      {HYROX_EQUIPMENT_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={input.hyrox_equipment.includes(opt.value)}
                          onClick={() => toggleEquipment(opt.value)}
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="1K Ski">
                      <input
                        className={inputClass}
                        value={input.ski_1k_time}
                        onChange={(e) => setInput((p) => ({ ...p, ski_1k_time: e.target.value }))}
                      />
                    </Field>
                    <Field label="1K Row">
                      <input
                        className={inputClass}
                        value={input.row_1k_time}
                        onChange={(e) => setInput((p) => ({ ...p, row_1k_time: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field label="Wall ball standard">
                    <input
                      className={inputClass}
                      value={input.wall_ball_standard}
                      onChange={(e) => setInput((p) => ({ ...p, wall_ball_standard: e.target.value }))}
                    />
                  </Field>
                  <Field label="Sled experience">
                    <div className="flex flex-wrap gap-1.5">
                      {SLED_EXPERIENCE_OPTIONS.map((opt) => (
                        <Pill
                          key={opt.value}
                          active={input.sled_experience === opt.value}
                          onClick={() =>
                            setInput((p) => ({
                              ...p,
                              sled_experience: opt.value as SledPushPullExperience,
                            }))
                          }
                        >
                          {opt.label}
                        </Pill>
                      ))}
                    </div>
                  </Field>
                  <Field label="Compromised running confidence (1–10)">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className={inputClass}
                      value={input.compromised_running_confidence ?? ""}
                      onChange={(e) =>
                        setInput((p) => ({
                          ...p,
                          compromised_running_confidence: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </aside>

          {/* Output */}
          <div className="space-y-6">
            {!preview ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-zinc-600" />
                <p className="mt-4 text-lg font-semibold text-zinc-300">No preview yet</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Configure inputs and click Generate Preview to build a 4-week in-memory block.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold uppercase text-zinc-950">
                      {preview.block_phase_label}
                    </span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-400">
                      Block {preview.block_number}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">{preview.block_label}</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {preview.track === "hyrox" ? "HYROX Specific" : "Hybrid Performance"} ·{" "}
                    {input.training_days_per_week} days · {input.ability_level}
                    {input.double_session_availability ? " · doubles" : ""}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">{preview.progression_focus}</p>
                  {preview.coach_support_note ? (
                    <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-400">
                      {preview.coach_support_note}
                    </p>
                  ) : null}
                  {preview.weakness_focus_block.length > 0 ? (
                    <p className="mt-2 text-sm text-amber-200/80">
                      Block weakness focus: {preview.weakness_focus_block.join(" · ")}
                    </p>
                  ) : null}
                  {preview.equipment_substitutions.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-amber-200/70">
                      {preview.equipment_substitutions.map((sub) => (
                        <li key={sub}>⚠ {sub}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {qa ? (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-white">Methodology QA</h2>
                      <div className="flex gap-3 text-xs font-semibold">
                        <span className="text-emerald-400">{qa.pass_count} pass</span>
                        <span className="text-amber-400">{qa.warn_count} warn</span>
                        <span className="text-red-400">{qa.fail_count} fail</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {qaByCategory.map(([category, items]) => (
                        <div key={category}>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                            {category}
                          </p>
                          <ul className="space-y-2">
                            {items.map((c, i) => (
                              <li
                                key={`${category}-${i}`}
                                className="flex items-start gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm"
                              >
                                <QaIcon status={c.status} />
                                <span className="text-zinc-300">{c.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section>
                  <div className="mb-4 flex gap-2 overflow-x-auto">
                    {preview.weeks.map((w) => (
                      <button
                        key={w.week_number}
                        type="button"
                        onClick={() => setSelectedWeek(w.week_number)}
                        className={cn(
                          "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition",
                          selectedWeek === w.week_number
                            ? "bg-yellow-400 text-zinc-950"
                            : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                        )}
                      >
                        W{w.week_number}
                      </button>
                    ))}
                  </div>

                  {week ? (
                    <>
                      <p className="text-sm font-semibold text-white">{week.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{week.focus}</p>
                      <p className="mt-1 text-xs text-yellow-400/90">{week.progression_focus}</p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Planned time", value: `${week.metrics.total_planned_minutes} min` },
                          { label: "Aerobic", value: `${week.metrics.aerobic_minutes} min` },
                          { label: "Threshold", value: `${week.metrics.threshold_minutes} min` },
                          { label: "Strength", value: `${week.metrics.strength_minutes} min` },
                          { label: "Run sessions", value: String(week.metrics.run_sessions) },
                          { label: "Erg sessions", value: String(week.metrics.erg_sessions) },
                          { label: "Hard sessions", value: String(week.metrics.hard_sessions) },
                          {
                            label: "Optional add-ons",
                            value: `${week.metrics.optional_addon_minutes} min`,
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                          >
                            <p className="text-[10px] uppercase tracking-wide text-zinc-600">{m.label}</p>
                            <p className="text-sm font-semibold text-zinc-200">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 space-y-3">
                        {week.sessions.map((session) => (
                          <article
                            key={`${week.week_number}-${session.day}-${session.slot}-${session.title}`}
                            className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-yellow-400/90">
                                  {session.day}
                                  {session.slot === "am" ? " · AM" : session.slot === "pm" ? " · PM" : ""}
                                </p>
                                <h3 className="mt-1 text-base font-semibold text-white">{session.title}</h3>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {session.progression_note} · {session.block_week_progression_note}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                                  {session.session_type}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                    stressBadge(session.stress)
                                  )}
                                >
                                  {session.stress}
                                </span>
                                {session.hyrox_pillar ? (
                                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                    {session.hyrox_pillar.replace(/_/g, " ")}
                                  </span>
                                ) : null}
                                {session.is_optional_session ? (
                                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                    Optional
                                  </span>
                                ) : null}
                                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                                  {session.metadata.progression_marker}
                                </span>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{session.purpose}</p>

                            {session.coach_support_note ? (
                              <p className="mt-3 text-xs italic text-zinc-500">{session.coach_support_note}</p>
                            ) : null}

                            {(session.target_pace_guidance || session.target_erg_guidance) && (
                              <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-100/90">
                                {session.target_pace_guidance ? (
                                  <p>{session.target_pace_guidance}</p>
                                ) : null}
                                {session.target_erg_guidance ? (
                                  <p className={session.target_pace_guidance ? "mt-1" : ""}>
                                    {session.target_erg_guidance}
                                  </p>
                                ) : null}
                              </div>
                            )}

                            <div className="mt-3 space-y-2 text-sm">
                              <div>
                                <span className="text-xs font-semibold uppercase text-zinc-600">Warm-up</span>
                                <p className="text-zinc-400">{session.warm_up}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold uppercase text-zinc-600">Main set</span>
                                <p className="text-zinc-300">{session.main_set}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold uppercase text-zinc-600">Cool-down</span>
                                <p className="text-zinc-400">{session.cool_down}</p>
                              </div>
                            </div>

                            {session.optional_addon ? (
                              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                                <p className="text-xs font-bold uppercase text-emerald-400">Optional add-on</p>
                                <p className="mt-1 text-sm font-medium text-emerald-100">
                                  {session.optional_addon.title} · {session.optional_addon.duration_range} · RPE{" "}
                                  {session.optional_addon.rpe}
                                </p>
                                <p className="mt-1 text-xs text-zinc-400">{session.optional_addon.purpose}</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Skip if: {session.optional_addon.skip_when}
                                </p>
                                {session.optional_addon.coach_support_note ? (
                                  <p className="mt-1 text-xs italic text-zinc-500">
                                    {session.optional_addon.coach_support_note}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            {session.extra_round_rule ? (
                              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90">
                                <span className="text-xs font-bold uppercase text-amber-400">Extra rounds</span>
                                <p className="mt-1">{session.extra_round_rule}</p>
                              </div>
                            ) : null}

                            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <dt className="text-zinc-600">RPE</dt>
                                <dd className="font-medium text-zinc-200">{session.rpe}</dd>
                              </div>
                              <div>
                                <dt className="text-zinc-600">Duration</dt>
                                <dd className="font-medium text-zinc-200">{session.duration_minutes} min</dd>
                              </div>
                              <div className="sm:col-span-2">
                                <dt className="text-zinc-600">Record</dt>
                                <dd className="font-medium text-zinc-200">{session.what_to_record}</dd>
                              </div>
                              <div className="sm:col-span-2 lg:col-span-4">
                                <dt className="text-zinc-600">Scaling</dt>
                                <dd className="text-zinc-400">{session.scaling}</dd>
                              </div>
                              {session.equipment_notes ? (
                                <div className="sm:col-span-2 lg:col-span-4">
                                  <dt className="text-zinc-600">Equipment note</dt>
                                  <dd className="text-amber-200/80">{session.equipment_notes}</dd>
                                </div>
                              ) : null}
                              {session.weakness_focus.length > 0 ? (
                                <div className="sm:col-span-2 lg:col-span-4">
                                  <dt className="text-zinc-600">Weakness focus</dt>
                                  <dd className="mt-1 flex flex-wrap gap-1.5">
                                    {session.weakness_focus.map((w) => (
                                      <span
                                        key={w}
                                        className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                                      >
                                        {w}
                                      </span>
                                    ))}
                                  </dd>
                                </div>
                              ) : null}
                            </dl>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
