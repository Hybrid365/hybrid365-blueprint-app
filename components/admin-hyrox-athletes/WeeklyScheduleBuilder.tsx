"use client";

import type { CoachDraftDay, CoachDraftSession } from "@/app/lib/hyroxCoachProgrammeDraft";
import { TIME_OF_DAY_OPTIONS, WEEKDAYS, type WeekdayName } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { PrescriptionDetailBlocks } from "@/components/admin-hyrox-athletes/PrescriptionDetailBlocks";

export function WeeklyScheduleBuilder({
  days,
  addTarget,
  onSelectAddTarget,
  onEdit,
  onMove,
  onReplace,
  onRemove,
  onDuplicate,
  onViewDetail,
}: {
  days: CoachDraftDay[];
  addTarget: { day: WeekdayName; slot: SandboxTimeOfDay } | null;
  onSelectAddTarget: (day: WeekdayName, slot: SandboxTimeOfDay) => void;
  onEdit: (dayIndex: number, sessionIndex: number) => void;
  onMove: (dayIndex: number, sessionIndex: number) => void;
  onReplace: (dayIndex: number, sessionIndex: number) => void;
  onRemove: (dayIndex: number, sessionIndex: number) => void;
  onDuplicate: (dayIndex: number, sessionIndex: number) => void;
  onViewDetail: (dayIndex: number, sessionIndex: number) => void;
}) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-bold text-white">Weekly schedule</h2>
        <p className="text-[11px] text-zinc-500">Mon–Sun · AM / Main / PM / Optional</p>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {days.map((day, dayIndex) => (
          <DayColumn
            key={day.day}
            day={day}
            dayIndex={dayIndex}
            addTarget={addTarget}
            onSelectAddTarget={onSelectAddTarget}
            onEdit={onEdit}
            onMove={onMove}
            onReplace={onReplace}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </section>
  );
}

function DayColumn({
  day,
  dayIndex,
  addTarget,
  onSelectAddTarget,
  onEdit,
  onMove,
  onReplace,
  onRemove,
  onDuplicate,
  onViewDetail,
}: {
  day: CoachDraftDay;
  dayIndex: number;
  addTarget: { day: WeekdayName; slot: SandboxTimeOfDay } | null;
  onSelectAddTarget: (day: WeekdayName, slot: SandboxTimeOfDay) => void;
  onEdit: (dayIndex: number, sessionIndex: number) => void;
  onMove: (dayIndex: number, sessionIndex: number) => void;
  onReplace: (dayIndex: number, sessionIndex: number) => void;
  onRemove: (dayIndex: number, sessionIndex: number) => void;
  onDuplicate: (dayIndex: number, sessionIndex: number) => void;
  onViewDetail: (dayIndex: number, sessionIndex: number) => void;
}) {
  const weekday = day.day as WeekdayName;

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-yellow-400/90">{day.day}</p>
          <p className="text-[10px] text-zinc-500">
            {day.roleLabel} · {day.hardEasyLabel}
            {day.thresholdMinutes > 0 ? ` · ${day.thresholdMinutes}′ TH` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {TIME_OF_DAY_OPTIONS.map((slot) => {
            const active = addTarget?.day === weekday && addTarget.slot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectAddTarget(weekday, slot)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  active
                    ? "bg-yellow-400/20 text-yellow-200 ring-1 ring-yellow-500/40"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                +{slot}
              </button>
            );
          })}
        </div>
      </header>
      {day.sessions.length === 0 ? (
        <p className="text-xs text-zinc-600">Rest / no sessions</p>
      ) : (
        <ul className="space-y-2">
          {day.sessions.map((s, sessionIndex) => (
            <SessionCard
              key={s.draftId}
              session={s}
              hardLabel={day.hardEasyLabel}
              onEdit={() => onEdit(dayIndex, sessionIndex)}
              onMove={() => onMove(dayIndex, sessionIndex)}
              onReplace={() => onReplace(dayIndex, sessionIndex)}
              onRemove={() => onRemove(dayIndex, sessionIndex)}
              onDuplicate={() => onDuplicate(dayIndex, sessionIndex)}
              onViewDetail={() => onViewDetail(dayIndex, sessionIndex)}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

function SessionCard({
  session,
  hardLabel,
  onEdit,
  onMove,
  onReplace,
  onRemove,
  onDuplicate,
  onViewDetail,
}: {
  session: CoachDraftSession;
  hardLabel: string;
  onEdit: () => void;
  onMove: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onViewDetail: () => void;
}) {
  const p = session.prescription;
  const target = p?.targetPace ?? p?.targetSplit ?? p?.targetLoad;

  return (
    <li
      className={`rounded-lg border p-2.5 ${
        session.placementWarning
          ? "border-orange-500/40 bg-orange-400/5"
          : session.isKeySession
            ? "border-yellow-500/35 bg-yellow-400/5"
            : session.isOptional
              ? "border-sky-500/25 bg-sky-950/40"
              : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <div className="flex flex-wrap gap-1">
        <span className="rounded border border-zinc-700 px-1 text-[9px] font-bold text-zinc-400">
          {session.timeOfDay}
        </span>
        {session.badges.slice(0, 2).map((b) => (
          <span
            key={b}
            className="rounded border border-yellow-500/30 bg-yellow-400/10 px-1 text-[9px] text-yellow-200"
          >
            {b}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs font-bold text-white">{session.title}</p>
      <p className="text-[10px] uppercase text-zinc-600">
        {session.sessionType.replace(/_/g, " ")} · {hardLabel}
      </p>
      <p className="mt-1 text-[10px] text-zinc-500">
        {session.duration}
        {session.thresholdMinutes ? ` · TH ${session.thresholdMinutes}′` : ""}
      </p>
      {target ? (
        <p className="mt-0.5 text-[10px] text-yellow-400/70">Target: {target}</p>
      ) : null}
      <p className="mt-0.5 text-[10px] text-zinc-500">{session.rpeHr}</p>
      <p className="mt-1 line-clamp-2 text-[10px] text-zinc-600">{session.rationale}</p>
      {session.showDetail && p ? (
        <div className="mt-2 max-h-[480px] overflow-y-auto border-t border-zinc-800 pt-2">
          <PrescriptionDetailBlocks p={p} />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1">
        <Btn label="View" onClick={onViewDetail} />
        <Btn label="Edit" onClick={onEdit} />
        <Btn label="Move" onClick={onMove} />
        <Btn label="Replace" onClick={onReplace} />
        <Btn label="Dup opt" onClick={onDuplicate} />
        <Btn label="Remove" onClick={onRemove} danger />
      </div>
    </li>
  );
}

function Btn({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${
        danger
          ? "border-red-500/30 text-red-300"
          : "border-zinc-700 text-zinc-400 hover:border-yellow-500/30 hover:text-yellow-200"
      }`}
    >
      {label}
    </button>
  );
}
