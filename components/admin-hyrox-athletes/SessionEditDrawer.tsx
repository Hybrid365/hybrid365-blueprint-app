"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoachDraftSession, CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import { calcThresholdMinutesFromConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import { detectManualTargetStaleWarning } from "@/app/lib/hyroxSessionTargetOverrides";
import { PrescriptionDetailBlocks } from "@/components/admin-hyrox-athletes/PrescriptionDetailBlocks";
import { X } from "lucide-react";

export function SessionEditDrawer({
  session,
  open,
  onClose,
  onSave,
}: {
  session: CoachDraftSession | null;
  open: boolean;
  onClose: () => void;
  onSave: (config: CoachSessionEditConfig) => void | Promise<void>;
}) {
  const [c, setC] = useState<CoachSessionEditConfig | null>(null);

  useEffect(() => {
    if (session && open) setC({ ...session.editConfig });
  }, [session, open]);

  const staleTargetWarning = useMemo(
    () => (session && c ? detectManualTargetStaleWarning(session, c) : null),
    [session, c]
  );

  if (!open || !session || !c) return null;

  const patch = (p: Partial<CoachSessionEditConfig>) => {
    setC((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...p };
      if (p.recovery !== undefined && p.restRecovery === undefined) {
        next.restRecovery = p.recovery;
      }
      next.thresholdMinutes = calcThresholdMinutesFromConfig(next);
      return next;
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-yellow-400/80">Edit session</p>
            <h3 className="text-lg font-bold text-white">{session.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>
        {session.prescription ? (
          <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-zinc-500">Prescription (library)</p>
            <div className="mt-2 max-h-[min(50vh,360px)] overflow-y-auto pr-1">
              <PrescriptionDetailBlocks p={session.prescription} />
            </div>
          </div>
        ) : null}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field label="Session name" value={c.sessionName} onChange={(v) => patch({ sessionName: v })} />
          <TextArea label="Objective" value={c.objective ?? ""} onChange={(v) => patch({ objective: v })} />
          <TextArea
            label="Warm-up (one line per bullet)"
            value={(c.warmUpLines ?? []).join("\n")}
            onChange={(v) =>
              patch({ warmUpLines: v.split("\n").map((s) => s.trim()).filter(Boolean) })
            }
          />
          <TextArea
            label="Main set (one line per bullet — leave blank to auto-build from reps)"
            value={(c.mainSetLines ?? []).join("\n")}
            onChange={(v) =>
              patch({ mainSetLines: v.split("\n").map((s) => s.trim()).filter(Boolean) })
            }
          />
          <TextArea
            label="Cool-down (one line per bullet)"
            value={(c.coolDownLines ?? []).join("\n")}
            onChange={(v) =>
              patch({ coolDownLines: v.split("\n").map((s) => s.trim()).filter(Boolean) })
            }
          />

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
            <p className="text-xs font-bold uppercase text-amber-300">Manual targets / pacing</p>
            <p className="text-[11px] text-zinc-500">
              These override generated library text on the athlete session detail (pace, split, HR, RPE, rest).
            </p>
            {staleTargetWarning ? (
              <p className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
                {staleTargetWarning}
              </p>
            ) : null}
            <Field
              label="Target pace / load"
              value={c.targetPaceLoad ?? ""}
              onChange={(v) => patch({ targetPaceLoad: v })}
              placeholder="e.g. 3:40–3:50/km · heavy but smooth"
            />
            <Field
              label="Target split / watts"
              value={c.targetSplitWatts ?? c.targetSplit ?? ""}
              onChange={(v) => patch({ targetSplitWatts: v, targetSplit: v })}
              placeholder="e.g. 1:55–2:00/500m · 250–280w"
            />
            <Field
              label="Target HR / HR zone"
              value={c.hrGuide ?? c.hrZone ?? ""}
              onChange={(v) => patch({ hrGuide: v, hrZone: v })}
              placeholder="e.g. Z4 · 165–175 bpm"
            />
            <Field
              label="Target RPE"
              value={c.rpeTarget ?? ""}
              onChange={(v) => patch({ rpeTarget: v })}
              placeholder="e.g. RPE 7–8"
            />
            <Field
              label="Rest / recovery"
              value={c.restRecovery ?? c.recovery ?? ""}
              onChange={(v) => patch({ restRecovery: v, recovery: v })}
              placeholder="e.g. 90 sec · 2 min easy jog"
            />
            <TextArea
              label="Coach pacing note"
              value={c.coachPacingNote ?? ""}
              onChange={(v) => patch({ coachPacingNote: v })}
            />
          </div>

          {c.kind === "threshold_run" && (
            <>
              <Row2
                a={{ label: "Reps", value: String(c.reps ?? ""), onChange: (v) => patch({ reps: Number(v) }) }}
                b={{
                  label: "Rep duration (min)",
                  value: String(c.repDurationMinutes ?? ""),
                  onChange: (v) => patch({ repDurationMinutes: Number(v) }),
                }}
              />
            </>
          )}

          {c.kind === "erg_interval" && (
            <>
              <Select
                label="Modality"
                value={c.modality ?? "ski"}
                options={[
                  { value: "ski", label: "Ski" },
                  { value: "row", label: "Row" },
                  { value: "bike", label: "Bike" },
                ]}
                onChange={(v) => patch({ modality: v as CoachSessionEditConfig["modality"] })}
              />
              <Row2
                a={{
                  label: "Reps",
                  value: String(c.ergReps ?? ""),
                  onChange: (v) => patch({ ergReps: Number(v) }),
                }}
                b={{
                  label: "Interval (min)",
                  value: String(c.intervalDurationMinutes ?? ""),
                  onChange: (v) => patch({ intervalDurationMinutes: Number(v) }),
                }}
              />
            </>
          )}

          {c.kind === "easy_aerobic" && (
            <>
              <Select
                label="Modality"
                value={c.modality ?? "bike"}
                options={[
                  { value: "bike", label: "Bike" },
                  { value: "ski", label: "Ski" },
                  { value: "row", label: "Row" },
                ]}
                onChange={(v) => patch({ modality: v as CoachSessionEditConfig["modality"] })}
              />
              <Field
                label="Duration (min)"
                value={String(c.durationMinutes ?? "")}
                onChange={(v) => patch({ durationMinutes: Number(v) })}
              />
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={c.upperGripAddOn ?? false}
                  onChange={(e) => patch({ upperGripAddOn: e.target.checked })}
                  className="accent-yellow-400"
                />
                Optional upper/grip add-on
              </label>
            </>
          )}

          {c.kind === "strength_endurance" && (
            <>
              <TextArea
                label="Exercises / main set"
                value={c.exercises ?? ""}
                onChange={(v) => patch({ exercises: v })}
              />
              <Field label="Sets × reps" value={c.setsReps ?? ""} onChange={(v) => patch({ setsReps: v })} />
              <Field label="Tempo" value={c.tempo ?? ""} onChange={(v) => patch({ tempo: v })} />
              <Field label="Rest" value={c.rest ?? ""} onChange={(v) => patch({ rest: v })} />
              <Field label="Load / RPE" value={c.loadRpe ?? ""} onChange={(v) => patch({ loadRpe: v })} />
              <Field
                label="Station finisher"
                value={c.stationFinisher ?? ""}
                onChange={(v) => patch({ stationFinisher: v })}
              />
            </>
          )}

          {c.kind === "compromised" && (
            <>
              <Row2
                a={{
                  label: "Rounds",
                  value: String(c.rounds ?? ""),
                  onChange: (v) => patch({ rounds: Number(v) }),
                }}
                b={{
                  label: "Run (m)",
                  value: String(c.runDistanceM ?? ""),
                  onChange: (v) => patch({ runDistanceM: Number(v) }),
                }}
              />
              <Field label="Station" value={c.station ?? ""} onChange={(v) => patch({ station: v })} />
              <Field
                label="Station detail"
                value={c.stationDetail ?? ""}
                onChange={(v) => patch({ stationDetail: v })}
              />
              <Row2
                a={{
                  label: "Bike watts",
                  value: c.bikeWatts ?? "",
                  onChange: (v) => patch({ bikeWatts: v }),
                }}
                b={{
                  label: "Bike interval (min)",
                  value: String(c.bikeDurationMinutes ?? ""),
                  onChange: (v) => patch({ bikeDurationMinutes: Number(v) }),
                }}
              />
              <Row2
                a={{
                  label: "Wall ball reps",
                  value: String(c.wallBallReps ?? ""),
                  onChange: (v) => patch({ wallBallReps: Number(v) }),
                }}
                b={{
                  label: "Burpee reps",
                  value: String(c.burpeeReps ?? ""),
                  onChange: (v) => patch({ burpeeReps: Number(v) }),
                }}
              />
              <Row2
                a={{
                  label: "EMOM duration (min)",
                  value: String(c.emomMinutes ?? ""),
                  onChange: (v) => patch({ emomMinutes: Number(v) }),
                }}
                b={{
                  label: "Lunge block (min)",
                  value: String(c.lungeDurationMinutes ?? ""),
                  onChange: (v) => patch({ lungeDurationMinutes: Number(v) }),
                }}
              />
              <Field label="Film prompt" value={c.filmPrompt ?? ""} onChange={(v) => patch({ filmPrompt: v })} />
            </>
          )}

          <p className="text-xs text-zinc-500">
            Threshold minutes (auto):{" "}
            <span className="text-yellow-400/90">{calcThresholdMinutesFromConfig(c) ?? "—"}</span>
          </p>
          <TextArea label="Coach note" value={c.coachNote ?? ""} onChange={(v) => patch({ coachNote: v })} />
          <TextArea
            label="What to record (comma-separated)"
            value={(c.whatToRecord ?? []).join(", ")}
            onChange={(v) =>
              patch({ whatToRecord: v.split(",").map((s) => s.trim()).filter(Boolean) })
            }
          />
        </div>
        <footer className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={() => void onSave(c)}
            className="w-full rounded-full bg-yellow-400 py-3 text-sm font-black text-zinc-950"
          >
            Apply &amp; save to draft
          </button>
        </footer>
      </aside>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Row2({
  a,
  b,
}: {
  a: { label: string; value: string; onChange: (v: string) => void };
  b: { label: string; value: string; onChange: (v: string) => void };
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field {...a} />
      <Field {...b} />
    </div>
  );
}
