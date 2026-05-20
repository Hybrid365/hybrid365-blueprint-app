"use client";

import { useMemo, useState } from "react";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  buildSandboxFourWeekProgression,
  buildSandboxProfilePreview,
  buildSandboxRecoveryAdjustments,
  buildSandboxWeeklySchedule,
  DEFAULT_SANDBOX_INPUTS,
  sandboxBuildProgrammeContext,
  sandboxToClassificationInput,
  type ProgrammeSandboxInputs,
  type SandboxStationOption,
} from "@/app/lib/hyroxProgrammeSandbox";
import { classifyAthlete } from "@/src/lib/hyrox/athleteClassification";
import {
  calculateHyroxRunPaceEstimate,
  calculatePaceZones,
  estimate10kSecondsFrom5k,
} from "@/src/lib/hyrox/paceCalculator";
import type { BlockWeekInCycle, Weekday } from "@/src/lib/hyrox/types";
import { SandboxDayScheduleCard } from "@/components/admin/hyrox-programme-preview/SandboxDayScheduleCard";

const STATION_OPTIONS: { id: SandboxStationOption; label: string }[] = [
  { id: "ski", label: "SkiErg" },
  { id: "sled_push_pull", label: "Sled push / pull" },
  { id: "burpees", label: "Burpee broad jumps" },
  { id: "row", label: "Row" },
  { id: "farmers_carry", label: "Farmer's carry" },
  { id: "lunges", label: "Sandbag lunges" },
  { id: "wall_balls", label: "Wall balls" },
];

const AUDIT_BUTTONS = [
  "Approve draft",
  "Too intense",
  "Too easy",
  "Wrong focus",
  "Needs more station specificity",
  "Needs more running development",
  "Needs more recovery",
] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">{children}</label>;
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function EditableProgrammeSandbox() {
  const [inputs, setInputs] = useState<ProgrammeSandboxInputs>(DEFAULT_SANDBOX_INPUTS);
  const [auditNote, setAuditNote] = useState<string | null>(null);
  const [expandedBlockKey, setExpandedBlockKey] = useState<string | null>(null);

  const patch = (partial: Partial<ProgrammeSandboxInputs>) =>
    setInputs((prev) => ({ ...prev, ...partial }));

  const classification = useMemo(
    () => classifyAthlete(sandboxToClassificationInput(inputs)),
    [inputs]
  );

  const ctx = useMemo(
    () => sandboxBuildProgrammeContext(inputs, classification),
    [inputs, classification]
  );

  const profilePreview = useMemo(
    () => buildSandboxProfilePreview(inputs, classification, ctx),
    [inputs, classification, ctx]
  );

  const scheduleResult = useMemo(
    () => buildSandboxWeeklySchedule(inputs, ctx, classification),
    [inputs, ctx, classification]
  );

  const weeklySchedule = scheduleResult.days;
  const scheduleWarnings = scheduleResult.warnings;
  const hoursPlan = scheduleResult.hoursPlan;

  const fourWeek = useMemo(() => buildSandboxFourWeekProgression(inputs), [inputs]);

  const recovery = useMemo(() => buildSandboxRecoveryAdjustments(inputs, ctx), [inputs, ctx]);

  const paceZones = useMemo(
    () => calculatePaceZones(inputs.fiveKm, inputs.tenKm.trim() || null),
    [inputs.fiveKm, inputs.tenKm]
  );

  const hyroxPace = useMemo(
    () => calculateHyroxRunPaceEstimate(inputs.fiveKm, inputs.abilityLevel),
    [inputs.fiveKm, inputs.abilityLevel]
  );

  const tenKmDisplay = useMemo(() => {
    if (inputs.tenKm.trim()) return inputs.tenKm;
    const sec = estimate10kSecondsFrom5k(inputs.fiveKm);
    if (sec == null) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")} (est.)`;
  }, [inputs.fiveKm, inputs.tenKm]);

  const toggleStation = (id: SandboxStationOption) => {
    setInputs((prev) => {
      const has = prev.stationWeaknesses.includes(id);
      return {
        ...prev,
        stationWeaknesses: has
          ? prev.stationWeaknesses.filter((s) => s !== id)
          : [...prev.stationWeaknesses, id],
      };
    });
  };

  return (
    <section className="mt-12 border-t border-zinc-800 pt-10">
      <SectionHeading
        title="Editable programme sandbox"
        action={
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_SANDBOX_INPUTS)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            Reset defaults
          </button>
        }
      />
      <p className="mb-6 text-sm text-zinc-500">
        Adjust athlete inputs and preview generated profile, weekly schedule, paces and 4-week
        progression. Uses <code className="text-yellow-400/80">src/lib/hyrox</code> helpers — not
        persisted.
      </p>

      {/* 1. Input panel */}
      <DashCard className="mb-8">
        <h3 className="m-0 text-sm font-bold text-yellow-400/90">Editable inputs</h3>
        <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div>
            <FieldLabel>Athlete level</FieldLabel>
            <SelectInput
              value={inputs.abilityLevel}
              onChange={(v) => patch({ abilityLevel: v as ProgrammeSandboxInputs["abilityLevel"] })}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
                { value: "pro", label: "Pro / Competitive" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Race timeline</FieldLabel>
            <SelectInput
              value={inputs.raceTimeline}
              onChange={(v) => patch({ raceTimeline: v as ProgrammeSandboxInputs["raceTimeline"] })}
              options={[
                { value: "16_plus", label: "16+ weeks out" },
                { value: "12", label: "12 weeks out" },
                { value: "8", label: "8 weeks out" },
                { value: "4", label: "4 weeks out" },
                { value: "race_week", label: "Race week" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Training days available</FieldLabel>
            <SelectInput
              value={String(inputs.trainingDays)}
              onChange={(v) => patch({ trainingDays: Number(v) })}
              options={[3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: String(n) }))}
            />
          </div>
          <div>
            <FieldLabel>Weekly training hours ({inputs.weeklyTrainingHours}h)</FieldLabel>
            <input
              type="range"
              min={3}
              max={15}
              step={0.5}
              value={inputs.weeklyTrainingHours}
              onChange={(e) => patch({ weeklyTrainingHours: Number(e.target.value) })}
              className="w-full accent-yellow-400"
            />
            <input
              type="number"
              min={3}
              max={18}
              step={0.5}
              value={inputs.weeklyTrainingHours}
              onChange={(e) => patch({ weeklyTrainingHours: Number(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <FieldLabel>Current weekly run volume (km)</FieldLabel>
            <input
              type="number"
              min={0}
              max={120}
              value={inputs.weeklyRunKm}
              onChange={(e) => patch({ weeklyRunKm: Number(e.target.value) })}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <FieldLabel>5km time (MM:SS)</FieldLabel>
            <input
              type="text"
              value={inputs.fiveKm}
              onChange={(e) => patch({ fiveKm: e.target.value })}
              placeholder="21:30"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <FieldLabel>10km time (optional)</FieldLabel>
            <input
              type="text"
              value={inputs.tenKm}
              onChange={(e) => patch({ tenKm: e.target.value })}
              placeholder="45:00"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <FieldLabel>Max heart rate (optional)</FieldLabel>
            <input
              type="number"
              min={120}
              max={220}
              value={inputs.maxHeartRate ?? ""}
              onChange={(e) =>
                patch({
                  maxHeartRate: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="e.g. 185"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <FieldLabel>Threshold heart rate (optional)</FieldLabel>
            <input
              type="number"
              min={120}
              max={200}
              value={inputs.thresholdHeartRate ?? ""}
              onChange={(e) =>
                patch({
                  thresholdHeartRate: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="e.g. 168"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <FieldLabel>Main limiter</FieldLabel>
            <SelectInput
              value={inputs.mainLimiter}
              onChange={(v) => patch({ mainLimiter: v as ProgrammeSandboxInputs["mainLimiter"] })}
              options={[
                { value: "running", label: "Running" },
                { value: "wall_balls", label: "Wall balls" },
                { value: "sled", label: "Sled push / pull" },
                { value: "burpees", label: "Burpees" },
                { value: "lunges", label: "Lunges" },
                { value: "ergs", label: "Ergs" },
                { value: "grip_carries", label: "Grip / carries" },
                { value: "compromised_running", label: "Compromised running" },
                { value: "recovery", label: "Recovery" },
                { value: "body_composition", label: "Body composition" },
              ]}
            />
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <FieldLabel>Station weaknesses</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {STATION_OPTIONS.map((s) => {
                const on = inputs.stationWeaknesses.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStation(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "border-yellow-500/40 bg-yellow-400/15 text-yellow-200"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <FieldLabel>Equipment access</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  ["treadmill", "Treadmill"],
                  ["track", "Track / route"],
                  ["skiErg", "SkiErg"],
                  ["rowErg", "RowErg"],
                  ["bike", "Bike"],
                  ["sled", "Sled"],
                  ["wallBalls", "Wall balls"],
                  ["sandbag", "Sandbag"],
                  ["farmersHandles", "Farmers / KBs"],
                  ["fullGym", "Full gym"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={inputs.equipment[key]}
                    onChange={(e) =>
                      patch({
                        equipment: { ...inputs.equipment, [key]: e.target.checked },
                      })
                    }
                    className="rounded border-zinc-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Double-session readiness</FieldLabel>
            <SelectInput
              value={inputs.doubleSessionReadiness}
              onChange={(v) =>
                patch({
                  doubleSessionReadiness: v as ProgrammeSandboxInputs["doubleSessionReadiness"],
                })
              }
              options={[
                { value: "not_ready", label: "Not ready" },
                { value: "aerobic_double_only", label: "Aerobic doubles only" },
                { value: "threshold_run_plus_easy_aerobic", label: "Threshold + easy aerobic" },
                { value: "threshold_run_plus_erg_threshold", label: "Threshold + erg threshold" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Recovery status</FieldLabel>
            <SelectInput
              value={inputs.recoveryStatus}
              onChange={(v) => patch({ recoveryStatus: v as ProgrammeSandboxInputs["recoveryStatus"] })}
              options={[
                { value: "good", label: "Good" },
                { value: "average", label: "Average" },
                { value: "poor", label: "Poor" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Sleep quality</FieldLabel>
            <SelectInput
              value={inputs.sleepQuality}
              onChange={(v) => patch({ sleepQuality: v as ProgrammeSandboxInputs["sleepQuality"] })}
              options={[
                { value: "good", label: "Good" },
                { value: "average", label: "Average" },
                { value: "poor", label: "Poor" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Current block</FieldLabel>
            <SelectInput
              value={String(inputs.programmeBlock)}
              onChange={(v) => patch({ programmeBlock: Number(v) as 1 | 2 | 3 })}
              options={[
                { value: "1", label: "Block 1 — Base & load tolerance" },
                { value: "2", label: "Block 2 — Threshold build" },
                { value: "3", label: "Block 3 — Specific race build" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Week in block</FieldLabel>
            <SelectInput
              value={String(inputs.blockWeek)}
              onChange={(v) => patch({ blockWeek: Number(v) as BlockWeekInCycle })}
              options={[
                { value: "1", label: "Week 1" },
                { value: "2", label: "Week 2" },
                { value: "3", label: "Week 3" },
                { value: "4", label: "Week 4 — deload" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Saturday available</FieldLabel>
            <SelectInput
              value={inputs.saturdayAvailable ? "yes" : "no"}
              onChange={(v) => patch({ saturdayAvailable: v === "yes" })}
              options={[
                { value: "yes", label: "Yes — can train Saturday" },
                { value: "no", label: "No — Saturday unavailable" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Preferred long aerobic day</FieldLabel>
            <SelectInput
              value={inputs.preferredLongAerobicDay}
              onChange={(v) => patch({ preferredLongAerobicDay: v as Weekday })}
              options={[
                { value: "Sun", label: "Sunday" },
                { value: "Sat", label: "Saturday" },
                { value: "Mon", label: "Monday" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Lower-body soreness / recovery</FieldLabel>
            <SelectInput
              value={inputs.lowerBodySoreness}
              onChange={(v) =>
                patch({ lowerBodySoreness: v as ProgrammeSandboxInputs["lowerBodySoreness"] })
              }
              options={[
                { value: "none", label: "None — legs fresh" },
                { value: "mild", label: "Mild DOMS" },
                { value: "high", label: "High — heavy leg fatigue" },
              ]}
            />
          </div>
        </div>
      </DashCard>

      {/* 2. Profile preview */}
      <DashCard className="mb-8" highlight>
        <SectionHeading title="Generated athlete profile" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Classification" value={profilePreview.classification} />
          <Stat label="Main limiter" value={profilePreview.mainLimiter} />
          <Stat label="Secondary limiter" value={profilePreview.secondaryLimiter} />
          <Stat label="Station priorities" value={profilePreview.stationPriorities} />
          <Stat label="Recovery risk" value={profilePreview.recoveryRisk} />
          <Stat label="Double sessions" value={profilePreview.doubleSessionReadiness} />
          <Stat label="Race timeline" value={profilePreview.raceTimeline} />
          <Stat label="Block focus" value={profilePreview.blockFocus} />
          <Stat label="Key coaching priority" value={profilePreview.coachingPriority} />
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          Max hard days/week: {classification.maxHardDaysPerWeek} · Prefer erg over run:{" "}
          {classification.preferErgOverRun ? "yes" : "no"}
        </p>
      </DashCard>

      {/* 5. Pace */}
      <DashCard className="mb-8">
        <SectionHeading title="Pace prescription preview" />
        {paceZones ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Easy" value={paceZones.easy} />
            <Stat label="Steady" value={paceZones.steady} />
            <Stat label="Threshold" value={paceZones.threshold} />
            <Stat label="10km pace" value={paceZones.tenK} />
            <Stat label="5km pace" value={paceZones.fiveK} />
            <Stat label="10km input" value={tenKmDisplay} />
            <Stat label="Hyrox race run (est.)" value={hyroxPace ?? paceZones.hyroxRaceRun} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Enter a valid 5km time to compute pace zones.</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          Pace targets are estimates. HR/RPE should override pace if the athlete is fatigued or
          drifting above threshold.
        </p>
      </DashCard>

      <DashCard className="mb-6">
        <SectionHeading title="Weekly hours & load" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Target hours" value={`${hoursPlan.weeklyTrainingHoursTarget}h`} />
          <Stat label="Key session time" value={`${Math.round(hoursPlan.plannedKeySessionMinutes / 60)}h`} />
          <Stat
            label="Remaining aerobic/support"
            value={`${Math.round(hoursPlan.remainingAerobicMinutes / 60)}h`}
          />
          <Stat label="Threshold minutes" value={`${hoursPlan.weeklyThresholdMinutes} min`} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">{hoursPlan.coachRationale}</p>
        {hoursPlan.fillStrategy.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {hoursPlan.fillStrategy.map((s) => (
              <li key={s} className="list-none">
                · {s}
              </li>
            ))}
          </ul>
        ) : null}
        {scheduleWarnings.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-amber-400/90">Scheduling warnings</p>
            <ul className="mt-2 space-y-2">
              {scheduleWarnings.map((w) => (
                <li
                  key={w.id}
                  className="list-none rounded-lg border border-amber-500/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-100/90"
                >
                  {w.message}
                  {w.days?.length ? ` (${w.days.join(" → ")})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DashCard>

      <section className="mb-8">
        <SectionHeading title="Generated weekly schedule" />
        <div className="space-y-3">
          {weeklySchedule.map((day) => (
            <SandboxDayScheduleCard
              key={day.day}
              day={day}
              expandedBlockKey={expandedBlockKey}
              onToggleBlock={setExpandedBlockKey}
            />
          ))}
        </div>
      </section>


      {/* 6. 4-week progression */}
      <section className="mb-8">
        <SectionHeading title="4-week progression preview" />
        <div className="grid gap-4 lg:grid-cols-2">
          {fourWeek.map((row) => (
            <DashCard
              key={row.week}
              className={`!p-4 ${row.week === inputs.blockWeek ? "!border-yellow-500/40" : ""}`}
            >
              <p className="text-sm font-bold text-white">{row.label}</p>
              <ul className="m-0 mt-3 space-y-2 p-0 text-xs text-zinc-400">
                <li className="list-none">
                  <span className="text-zinc-500">Run threshold:</span> {row.runThreshold}
                </li>
                <li className="list-none">
                  <span className="text-zinc-500">Run volume:</span> {row.runVolume}
                </li>
                <li className="list-none">
                  <span className="text-zinc-500">Station focus:</span> {row.stationWeakness}
                </li>
                <li className="list-none">
                  <span className="text-zinc-500">Compromised running:</span> {row.compromisedRunning}
                </li>
                <li className="list-none">
                  <span className="text-zinc-500">Strength endurance:</span> {row.strengthEndurance}
                </li>
              </ul>
            </DashCard>
          ))}
        </div>
      </section>

      {/* 7. Recovery */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <DashCard className="border-amber-500/25">
          <SectionHeading title="If recovery / sleep is poor" />
          <ul className="m-0 space-y-2 p-0">
            {recovery.poor.map((s) => (
              <li key={s} className="list-none text-sm text-zinc-300">
                · {s}
              </li>
            ))}
          </ul>
        </DashCard>
        <DashCard className="border-emerald-500/20">
          <SectionHeading title="If recovery is good (advanced)" />
          <ul className="m-0 space-y-2 p-0">
            {recovery.good.map((s) => (
              <li key={s} className="list-none text-sm text-zinc-300">
                · {s}
              </li>
            ))}
          </ul>
        </DashCard>
      </div>

      {/* 8. Coach audit */}
      <DashCard>
        <SectionHeading title="Coach audit panel" />
        <p className="mb-4 text-xs text-zinc-500">Placeholder actions — no backend yet.</p>
        <div className="flex flex-wrap gap-2">
          {AUDIT_BUTTONS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setAuditNote(label)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                auditNote === label
                  ? "border-yellow-500/50 bg-yellow-400/15 text-yellow-200"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {auditNote ? (
          <p className="mt-4 text-sm text-zinc-400">
            Flagged: <span className="font-medium text-yellow-300">{auditNote}</span> (mock only)
          </p>
        ) : null}
      </DashCard>
    </section>
  );
}
