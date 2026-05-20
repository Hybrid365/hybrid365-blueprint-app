"use client";

import { useEffect, useState } from "react";
import { HyroxField, HyroxInput, HyroxSelect, HyroxTextarea } from "@/components/hyrox-team/HyroxFormFields";
import {
  benchmarkKindForTestId,
  emptyRaceForm,
  emptySubmissionForKind,
  type BenchmarkSubmission,
  type HyroxRaceSplitSubmission,
  type RunSplitKey,
} from "./hyroxTestingTypes";

const modalBackdrop =
  "fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-4 sm:items-center";

const modalOverlay = "absolute inset-0 bg-black/70";

const modalHeader = "sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-5 py-4 backdrop-blur";

const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function BenchmarkSubmitModal({
  testId,
  testName,
  existing,
  onSave,
  onCancel,
}: {
  testId: string;
  testName: string;
  existing?: BenchmarkSubmission | null;
  onSave: (data: BenchmarkSubmission) => void;
  onCancel: () => void;
}) {
  const kind = benchmarkKindForTestId(testId);
  const [data, setData] = useState<BenchmarkSubmission>(() => {
    if (existing && existing.kind === kind) return existing;
    return emptySubmissionForKind(kind);
  });

  useEffect(() => {
    if (existing && existing.kind === kind) setData(existing);
    else setData(emptySubmissionForKind(kind));
  }, [testId, existing, kind]);

  const footer = (
    <div className="sticky bottom-0 flex gap-2 border-t border-zinc-800 bg-zinc-950/95 px-5 py-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-900"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => onSave(data)}
        className="flex-1 rounded-xl bg-[#f4d23c] py-2.5 text-sm font-black text-zinc-950 hover:bg-[#e6c435]"
      >
        Save result
      </button>
    </div>
  );

  return (
    <div className={modalBackdrop} role="dialog" aria-modal>
      <div className={modalOverlay} onClick={onCancel} aria-hidden />
      <div
        className={`relative z-10 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:max-w-xl`}
      >
        <div className={modalHeader}>
          <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#f4d23c]/80">Submit result</p>
          <h2 className="m-0 mt-1 text-lg font-bold text-white">{testName}</h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          {data.kind === "run_5k" ? (
            <>
              <Field label="Total time" v={data.resultTime} onChange={(v) => setData({ ...data, resultTime: v })} ph="mm:ss" />
              <Field label="Average pace (if known)" v={data.averagePace} onChange={(v) => setData({ ...data, averagePace: v })} ph="e.g. 4:25/km" />
              <Row2
                a={{ label: "Average HR (if known)", v: data.averageHr, onChange: (v) => setData({ ...data, averageHr: v }) }}
                b={{ label: "Max HR (if known)", v: data.maxHr, onChange: (v) => setData({ ...data, maxHr: v }) }}
              />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} ph="e.g. 8" />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "erg_ski_1k" ? (
            <>
              <Field label="Total time" v={data.resultTime} onChange={(v) => setData({ ...data, resultTime: v })} ph="mm:ss for 1km" />
              <Row2
                a={{ label: "Average split (if known)", v: data.averageSplit, onChange: (v) => setData({ ...data, averageSplit: v }) }}
                b={{ label: "Stroke rate (if known)", v: data.strokeRate, onChange: (v) => setData({ ...data, strokeRate: v }) }}
              />
              <Field label="Average HR (if known)" v={data.averageHr} onChange={(v) => setData({ ...data, averageHr: v })} />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "erg_row_2k" ? (
            <>
              <Field label="Total time" v={data.resultTime} onChange={(v) => setData({ ...data, resultTime: v })} ph="mm:ss for 2km" />
              <Row2
                a={{ label: "Average split (if known)", v: data.averageSplit, onChange: (v) => setData({ ...data, averageSplit: v }) }}
                b={{ label: "Stroke rate (if known)", v: data.strokeRate, onChange: (v) => setData({ ...data, strokeRate: v }) }}
              />
              <Field label="Average HR (if known)" v={data.averageHr} onChange={(v) => setData({ ...data, averageHr: v })} />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "mini_compromised" ? (
            <>
              <Field label="Total time" v={data.totalTime} onChange={(v) => setData({ ...data, totalTime: v })} />
              <Row2
                a={{ label: "First run split (1km)", v: data.firstRunSplit, onChange: (v) => setData({ ...data, firstRunSplit: v }) }}
                b={{ label: "Final run split (1km)", v: data.finalRunSplit, onChange: (v) => setData({ ...data, finalRunSplit: v }) }}
              />
              <Field label="Lunge load / variation" v={data.lungeLoad} onChange={(v) => setData({ ...data, lungeLoad: v })} ph="Sandbag kg, or BW / DB / KB" />
              <label className="block">
                <span className={labelCls}>Burpee / lunge notes</span>
                <HyroxTextarea
                  value={data.burpeeLungeNotes}
                  onChange={(e) => setData({ ...data, burpeeLungeNotes: e.target.value })}
                  placeholder="Setup, breaks, sandbag vs bodyweight lunges…"
                />
              </label>
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "farmer_hold" ? (
            <>
              <Row2
                a={{ label: "DB/KB weight per hand", v: data.weightPerHand, onChange: (v) => setData({ ...data, weightPerHand: v }) }}
                b={{ label: "Total hold time", v: data.totalHoldTime, onChange: (v) => setData({ ...data, totalHoldTime: v }) }}
              />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <LimitingFactorField
                value={data.limitingFactor}
                onChange={(v) => setData({ ...data, limitingFactor: v })}
                options={["grip", "traps", "posture", "pain", "other"]}
              />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "sandbag_lunge" ? (
            <>
              <Field label="Load used" v={data.loadUsed} onChange={(v) => setData({ ...data, loadUsed: v })} ph="kg or BW / DB" />
              <Field
                label="Total metres completed in 4 minutes"
                v={data.totalMetres4Min}
                onChange={(v) => setData({ ...data, totalMetres4Min: v })}
                ph="e.g. 280m"
              />
              <Field label="Number of breaks" v={data.numberOfBreaks} onChange={(v) => setData({ ...data, numberOfBreaks: v })} />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <LimitingFactorField
                value={data.limitingFactor}
                onChange={(v) => setData({ ...data, limitingFactor: v })}
                options={["quads", "glutes", "breathing", "balance", "pain", "other"]}
              />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "wall_ball" ? (
            <>
              <label className="block">
                <span className={labelCls}>Format used</span>
                <HyroxSelect value={data.formatUsed} onChange={(e) => setData({ ...data, formatUsed: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="max_unbroken">Max unbroken</option>
                  <option value="100_for_time">100 for time</option>
                </HyroxSelect>
              </label>
              <Row2
                a={{ label: "Ball weight", v: data.ballWeight, onChange: (v) => setData({ ...data, ballWeight: v }) }}
                b={{ label: "Target height (if known)", v: data.targetHeight, onChange: (v) => setData({ ...data, targetHeight: v }) }}
              />
              <Row2
                a={{ label: "Reps completed", v: data.repsCompleted, onChange: (v) => setData({ ...data, repsCompleted: v }) }}
                b={{ label: "Total time (if 100 for time)", v: data.totalTime, onChange: (v) => setData({ ...data, totalTime: v }) }}
              />
              <Field label="Number of breaks" v={data.numberOfBreaks} onChange={(v) => setData({ ...data, numberOfBreaks: v })} />
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <LimitingFactorField
                value={data.limitingFactor}
                onChange={(v) => setData({ ...data, limitingFactor: v })}
                options={["shoulders", "quads", "breathing", "technique", "pain", "other"]}
              />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}

          {data.kind === "sled_exposure" ? (
            <>
              <label className="block">
                <span className={labelCls}>Push or pull</span>
                <HyroxSelect value={data.pushOrPull} onChange={(e) => setData({ ...data, pushOrPull: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="push">Sled push</option>
                  <option value="pull">Sled pull</option>
                  <option value="both">Both (note in rep times)</option>
                </HyroxSelect>
              </label>
              <Row2
                a={{ label: "Load used", v: data.loadUsed, onChange: (v) => setData({ ...data, loadUsed: v }) }}
                b={{ label: "Surface type", v: data.surfaceType, onChange: (v) => setData({ ...data, surfaceType: v }) }}
              />
              <label className="block">
                <span className={labelCls}>Rep times (4 × 12.5m)</span>
                <HyroxTextarea
                  value={data.repTimes}
                  onChange={(e) => setData({ ...data, repTimes: e.target.value })}
                  placeholder="e.g. 18s, 19s, 20s, 21s — rest 90–120s between"
                  rows={2}
                />
              </label>
              <Field label="RPE 1–10" v={data.rpe} onChange={(v) => setData({ ...data, rpe: v })} />
              <LimitingFactorField
                value={data.limitingFactor}
                onChange={(v) => setData({ ...data, limitingFactor: v })}
                options={["strength", "technique", "grip", "surface", "breathing", "other"]}
              />
              <NotesField value={data.notes} onChange={(v) => setData({ ...data, notes: v })} />
            </>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  );
}

function Field({
  label,
  v,
  onChange,
  ph,
}: {
  label: string;
  v: string;
  onChange: (v: string) => void;
  ph?: string;
}) {
  return (
    <label className="block w-full">
      <span className={labelCls}>{label}</span>
      <HyroxInput value={v} onChange={(e) => onChange(e.target.value)} placeholder={ph} />
    </label>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={labelCls}>Notes</span>
      <HyroxTextarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function LimitingFactorField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className={labelCls}>Limiting factor</span>
      <HyroxSelect value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </HyroxSelect>
    </label>
  );
}

function Row2({
  a,
  b,
}: {
  a: { label: string; v: string; onChange: (v: string) => void };
  b: { label: string; v: string; onChange: (v: string) => void };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={a.label} v={a.v} onChange={a.onChange} />
      <Field label={b.label} v={b.v} onChange={b.onChange} />
    </div>
  );
}

const RUN_LABELS: { key: RunSplitKey; label: string }[] = [
  { key: "run1", label: "Run 1" },
  { key: "run2", label: "Run 2" },
  { key: "run3", label: "Run 3" },
  { key: "run4", label: "Run 4" },
  { key: "run5", label: "Run 5" },
  { key: "run6", label: "Run 6" },
  { key: "run7", label: "Run 7" },
  { key: "run8", label: "Run 8" },
];

export function RoxFitRaceModal({
  existing,
  onSave,
  onCancel,
}: {
  existing: HyroxRaceSplitSubmission | null;
  onSave: (data: Omit<HyroxRaceSplitSubmission, "id" | "submittedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(() => {
    if (existing) {
      const { id: _i, submittedAt: _s, ...rest } = existing;
      return rest;
    }
    return emptyRaceForm();
  });

  useEffect(() => {
    if (existing) {
      const { id: _i, submittedAt: _s, ...rest } = existing;
      setForm(rest);
    } else {
      setForm(emptyRaceForm());
    }
  }, [existing]);

  const patch = (partial: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...partial }));
  const patchRun = (key: RunSplitKey, value: string) =>
    setForm((prev) => ({ ...prev, runSplits: { ...prev.runSplits, [key]: value } }));
  const patchStation = (key: keyof typeof form.stationSplits, value: string) =>
    setForm((prev) => ({
      ...prev,
      stationSplits: { ...prev.stationSplits, [key]: value },
    }));

  return (
    <div className={modalBackdrop} role="dialog" aria-modal>
      <div className={modalOverlay} onClick={onCancel} />
      <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className={modalHeader}>
          <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#f4d23c]/80">Recent HYROX result</p>
          <h2 className="m-0 mt-1 text-lg font-bold text-white">Submit RoxFit / race splits</h2>
        </div>

        <div className="space-y-5 px-5 py-4">
          <section>
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Race details</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Event / location" v={form.raceLocation} onChange={(v) => patch({ raceLocation: v })} />
              <Field label="Race date" v={form.raceDate} onChange={(v) => patch({ raceDate: v })} ph="YYYY-MM-DD" />
              <label className="block sm:col-span-2">
                <span className={labelCls}>Category</span>
                <HyroxSelect value={form.category} onChange={(e) => patch({ category: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="Open">Open</option>
                  <option value="Pro">Pro</option>
                </HyroxSelect>
              </label>
              <Field label="Total finish time" v={form.totalFinishTime} onChange={(v) => patch({ totalFinishTime: v })} ph="h:mm:ss" />
              <Field label="Bodyweight at race (if known)" v={form.bodyweightKg} onChange={(v) => patch({ bodyweightKg: v })} />
              <label className="block sm:col-span-2">
                <span className={labelCls}>Notes / context</span>
                <HyroxTextarea value={form.raceNotes} onChange={(e) => patch({ raceNotes: e.target.value })} rows={2} />
              </label>
            </div>
          </section>

          <section>
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Run splits (from RoxFit)</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RUN_LABELS.map(({ key, label }) => (
                <Field key={key} label={label} v={form.runSplits[key]} onChange={(v) => patchRun(key, v)} />
              ))}
            </div>
          </section>

          <section>
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Station splits</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="SkiErg" v={form.stationSplits.skiErg} onChange={(v) => patchStation("skiErg", v)} />
              <Field label="Sled push" v={form.stationSplits.sledPush} onChange={(v) => patchStation("sledPush", v)} />
              <Field label="Sled pull" v={form.stationSplits.sledPull} onChange={(v) => patchStation("sledPull", v)} />
              <Field label="Burpee broad jumps" v={form.stationSplits.burpeeBroadJumps} onChange={(v) => patchStation("burpeeBroadJumps", v)} />
              <Field label="Row" v={form.stationSplits.row} onChange={(v) => patchStation("row", v)} />
              <Field label="Farmer's carry" v={form.stationSplits.farmersCarry} onChange={(v) => patchStation("farmersCarry", v)} />
              <Field label="Sandbag lunges" v={form.stationSplits.sandbagLunges} onChange={(v) => patchStation("sandbagLunges", v)} />
              <Field label="Wall balls" v={form.stationSplits.wallBalls} onChange={(v) => patchStation("wallBalls", v)} />
            </div>
          </section>

          <section>
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Optional</p>
            <label className="mt-2 block">
              <span className={labelCls}>RoxFit screenshot uploaded? (placeholder)</span>
              <HyroxSelect
                value={form.roxfitScreenshot}
                onChange={(e) => patch({ roxfitScreenshot: e.target.value as "yes" | "no" | "" })}
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </HyroxSelect>
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Which station felt worst?" v={form.worstStation} onChange={(v) => patch({ worstStation: v })} />
              <Field label="Which run felt worst?" v={form.worstRun} onChange={(v) => patch({ worstRun: v })} />
              <Field label="Biggest race limiter" v={form.biggestLimiter} onChange={(v) => patch({ biggestLimiter: v })} ph="e.g. legs under ski" />
              <label className="block sm:col-span-2">
                <span className={labelCls}>Anything unusual?</span>
                <HyroxTextarea value={form.unusual} onChange={(e) => patch({ unusual: e.target.value })} rows={2} />
              </label>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-zinc-800 bg-zinc-950/95 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="flex-1 rounded-xl bg-[#f4d23c] py-2.5 text-sm font-black text-zinc-950 hover:bg-[#e6c435]"
          >
            Save result
          </button>
        </div>
      </div>
    </div>
  );
}
