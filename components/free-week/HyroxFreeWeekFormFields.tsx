"use client";

import { useState } from "react";
import {
  HYROX_EQUIPMENT_OPTIONS,
  HYROX_STATION_OPTIONS,
  type HyroxFreeWeekInput,
  type HyroxStationWeakness,
} from "@/app/lib/freeWeekHyroxTypes";

const LIMITER_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "stations", label: "Stations" },
  { value: "strength", label: "Strength" },
  { value: "engine", label: "Engine / aerobic" },
  { value: "body_composition", label: "Body composition" },
  { value: "recovery", label: "Recovery" },
  { value: "consistency", label: "Consistency" },
  { value: "not_sure", label: "Not sure" },
] as const;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm text-zinc-200">{label}</label>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400";

export function HyroxFreeWeekFormFields({
  hyrox,
  onChange,
  equipment,
  onEquipmentChange,
}: {
  hyrox: HyroxFreeWeekInput;
  onChange: (patch: Partial<HyroxFreeWeekInput>) => void;
  equipment: string[];
  onEquipmentChange: (next: string[]) => void;
}) {
  const [benchmarksOpen, setBenchmarksOpen] = useState(false);

  const toggleEquip = (opt: string) => {
    onEquipmentChange(
      equipment.includes(opt) ? equipment.filter((x) => x !== opt) : [...equipment, opt]
    );
  };

  const toggleStation = (v: HyroxStationWeakness) => {
    const cur = hyrox.weakest_stations ?? [];
    onChange({
      weakest_stations: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    });
  };

  return (
    <div className="space-y-8 rounded-2xl border border-yellow-400/25 bg-yellow-400/5 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">HYROX Track</p>
        <p className="mt-2 text-sm text-zinc-300">
          Answer HYROX-specific questions for a Week 1 sample built around Hybrid365 HYROX methodology.
          Optional benchmarks help us return pace and split targets — leave blank for RPE-based guidance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="HYROX race booked?">
          <div className="flex gap-2">
            {[
              { v: true, l: "Yes" },
              { v: false, l: "Not yet" },
            ].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => onChange({ race_booked: v })}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  hyrox.race_booked === v
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-950"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Race date (optional)">
          <input
            type="date"
            value={hyrox.race_date ?? ""}
            onChange={(e) => onChange({ race_date: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Race category">
          <select
            value={hyrox.race_category ?? ""}
            onChange={(e) => onChange({ race_category: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="open">Open</option>
            <option value="pro">Pro</option>
            <option value="doubles">Doubles</option>
            <option value="relay">Relay</option>
          </select>
        </Field>
        <Field label="Target HYROX time (optional)">
          <input
            value={hyrox.race_target_time ?? ""}
            onChange={(e) => onChange({ race_target_time: e.target.value })}
            className={inputClass}
            placeholder="e.g. 1:30:00"
          />
        </Field>
      </div>

      <Field label="Main limiter for this free week">
        <select
          value={hyrox.main_limiter ?? "not_sure"}
          onChange={(e) => onChange({ main_limiter: e.target.value as HyroxFreeWeekInput["main_limiter"] })}
          className={inputClass}
        >
          {LIMITER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Weakest stations (select all that apply)">
        <div className="flex flex-wrap gap-2">
          {HYROX_STATION_OPTIONS.map((opt) => {
            const active = (hyrox.weakest_stations ?? []).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleStation(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  active ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-zinc-950"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="HYROX equipment access">
        <div className="grid gap-2 sm:grid-cols-2">
          {HYROX_EQUIPMENT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleEquip(opt)}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${
                equipment.includes(opt)
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Running limiter">
          <select
            value={hyrox.running_limiter ?? ""}
            onChange={(e) => onChange({ running_limiter: e.target.value })}
            className={inputClass}
          >
            <option value="">Not sure</option>
            <option value="speed">Speed</option>
            <option value="endurance">Endurance</option>
            <option value="consistency">Consistency</option>
            <option value="injury">Injury / niggles</option>
          </select>
        </Field>
        <Field label="Weekly run volume (km, optional)">
          <input
            value={hyrox.weekly_run_volume_km ?? ""}
            onChange={(e) => onChange({ weekly_run_volume_km: e.target.value })}
            className={inputClass}
            placeholder="e.g. 25"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Injuries / limitations (optional)">
          <textarea
            value={hyrox.injuries ?? ""}
            onChange={(e) => onChange({ injuries: e.target.value })}
            className={inputClass}
            rows={2}
            placeholder="Current injuries, movements to avoid…"
          />
        </Field>
        <Field label="Running niggles (optional)">
          <textarea
            value={hyrox.running_niggles ?? ""}
            onChange={(e) => onChange({ running_niggles: e.target.value })}
            className={inputClass}
            rows={2}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Sleep quality (1–10)">
          <input
            type="number"
            min={1}
            max={10}
            value={hyrox.sleep_quality ?? ""}
            onChange={(e) =>
              onChange({ sleep_quality: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Stress (1–10)">
          <input
            type="number"
            min={1}
            max={10}
            value={hyrox.stress_level ?? ""}
            onChange={(e) =>
              onChange({ stress_level: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Recovery confidence (1–10)">
          <input
            type="number"
            min={1}
            max={10}
            value={hyrox.recovery_confidence ?? ""}
            onChange={(e) =>
              onChange({ recovery_confidence: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setBenchmarksOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-sm font-semibold text-white"
        >
          Optional performance benchmarks
          <span className="text-zinc-500">{benchmarksOpen ? "−" : "+"}</span>
        </button>
        {benchmarksOpen ? (
          <div className="mt-4 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="text-xs text-zinc-500">
              The more detail you give us, the more specific your free HYROX week can be. Leave blank
              and we&apos;ll prescribe using RPE.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Recent 10k time">
                <input
                  value={hyrox.ten_k_time ?? ""}
                  onChange={(e) => onChange({ ten_k_time: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 52:00"
                />
              </Field>
              <Field label="Easy run pace">
                <input
                  value={hyrox.easy_run_pace ?? ""}
                  onChange={(e) => onChange({ easy_run_pace: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 5:30/km"
                />
              </Field>
              <Field label="1km SkiErg time">
                <input
                  value={hyrox.ski_1k_time ?? ""}
                  onChange={(e) => onChange({ ski_1k_time: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 4:30"
                />
              </Field>
              <Field label="1km RowErg time">
                <input
                  value={hyrox.row_1k_time ?? ""}
                  onChange={(e) => onChange({ row_1k_time: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 4:15"
                />
              </Field>
              <Field label="Ski threshold split (optional)">
                <input
                  value={hyrox.ski_threshold_split ?? ""}
                  onChange={(e) => onChange({ ski_threshold_split: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 2:05/500m"
                />
              </Field>
              <Field label="Row threshold split (optional)">
                <input
                  value={hyrox.row_threshold_split ?? ""}
                  onChange={(e) => onChange({ row_threshold_split: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 1:55/500m"
                />
              </Field>
              <Field label="Max HR (optional)">
                <input
                  type="number"
                  value={hyrox.max_hr ?? ""}
                  onChange={(e) =>
                    onChange({ max_hr: e.target.value ? Number(e.target.value) : null })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Threshold HR (optional)">
                <input
                  type="number"
                  value={hyrox.threshold_hr ?? ""}
                  onChange={(e) =>
                    onChange({ threshold_hr: e.target.value ? Number(e.target.value) : null })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={Boolean(hyrox.uses_hr_monitor)}
                onChange={(e) => onChange({ uses_hr_monitor: e.target.checked })}
              />
              I use a heart rate monitor
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
