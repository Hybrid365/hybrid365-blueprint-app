"use client";

import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";

export function CoachWeekSessionPreviewList({
  draft,
  weekLabel,
  role,
}: {
  draft: CoachDraftWeek;
  weekLabel: string;
  role: string;
}) {
  const sessions = draft.days.flatMap((d) =>
    d.sessions.map((s) => ({ day: d.day, ...s }))
  );

  if (!sessions.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
        Week not generated yet — no sessions in this week.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-yellow-400/80">
        {weekLabel} · {role}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">
        {sessions.length} sessions · preview before publish
      </p>
      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {sessions.map((s) => (
          <li
            key={s.draftId}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-yellow-400/90">{s.day}</span>
              <span className="text-zinc-500">{s.timeOfDay}</span>
              {s.isKeySession ? (
                <span className="rounded-full border border-yellow-500/30 px-1.5 py-0.5 text-[9px] text-yellow-300">
                  Key
                </span>
              ) : null}
              {s.isOptional ? (
                <span className="rounded-full border border-zinc-600 px-1.5 py-0.5 text-[9px] text-zinc-400">
                  Optional
                </span>
              ) : null}
            </div>
            <p className="mt-1 font-medium text-white">{s.title}</p>
            <p className="mt-0.5 text-zinc-500">
              {s.sessionType} · {s.duration} · {s.rpeHr ?? s.intensity}
            </p>
            {s.rationale ? (
              <p className="mt-1 line-clamp-2 text-zinc-500">{s.rationale}</p>
            ) : null}
            {s.coachNote ? (
              <p className="mt-1 text-[10px] italic text-zinc-600">Coach: {s.coachNote}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
