"use client";

import type { AthleteWeekPreview } from "@/app/lib/buildAthleteWeekPreview";
import { X } from "lucide-react";

export function AthleteWeekPreviewModal({
  preview,
  open,
  onClose,
}: {
  preview: AthleteWeekPreview;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const byDay = preview.sessions.reduce(
    (acc, s) => {
      if (!acc[s.day]) acc[s.day] = [];
      acc[s.day]!.push(s);
      return acc;
    },
    {} as Record<string, typeof preview.sessions>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
              Preview as athlete
            </p>
            <h2 className="text-lg font-bold text-white">{preview.athleteName}</h2>
            <p className="text-xs text-zinc-500">{preview.blockWeekLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="rounded-xl border border-yellow-500/25 bg-yellow-400/5 p-3">
            <h3 className="text-[10px] font-bold uppercase text-yellow-400/90">This week&apos;s focus</h3>
            <p className="mt-1 text-sm text-zinc-200">{preview.weeklyFocus}</p>
          </section>

          {preview.nextSession ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <h3 className="text-[10px] font-bold uppercase text-zinc-500">Next session</h3>
              <PreviewSessionCard session={preview.nextSession} highlight />
            </section>
          ) : null}

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <h3 className="text-[10px] font-bold uppercase text-zinc-500">Coach note</h3>
            <p className="mt-1 text-sm text-zinc-300">{preview.coachNote}</p>
          </section>

          {preview.whyThisWeek ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
              <h3 className="text-[10px] font-bold uppercase text-zinc-500">
                Why this week is built this way
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {preview.whyThisWeek}
              </p>
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase text-zinc-500">Your week</h3>
            <div className="space-y-3">
              {Object.entries(byDay).map(([day, sessions]) => (
                <div key={day}>
                  <p className="mb-1 text-xs font-bold text-yellow-400/80">{day}</p>
                  <ul className="space-y-2">
                    {sessions.map((s) => (
                      <li key={s.id}>
                        <PreviewSessionCard session={s} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-zinc-800 px-4 py-3">
          <p className="text-center text-[10px] text-zinc-600">
            Athlete view — internal validation and admin fields hidden
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-full bg-yellow-400 py-2.5 text-sm font-black text-zinc-950"
          >
            Close preview
          </button>
        </footer>
      </div>
    </div>
  );
}

function PreviewSessionCard({
  session,
  highlight,
}: {
  session: AthleteWeekPreview["sessions"][0];
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-yellow-500/35 bg-yellow-400/5"
          : session.isKey
            ? "border-zinc-700 bg-zinc-950/80"
            : "border-zinc-800/80 bg-zinc-950/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {session.timeLabel ? (
          <span className="text-[9px] font-bold uppercase text-zinc-500">{session.timeLabel}</span>
        ) : null}
        {session.isKey ? (
          <span className="rounded bg-yellow-400/15 px-1.5 py-0.5 text-[8px] font-bold text-yellow-200">
            Key session
          </span>
        ) : null}
        {session.isOptional ? (
          <span className="rounded bg-sky-400/10 px-1.5 py-0.5 text-[8px] text-sky-200">Optional</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm font-bold text-white">{session.title}</p>
      <p className="text-[11px] text-zinc-500">
        {session.duration} · {session.intensity}
      </p>
      {session.targetLine ? (
        <p className="mt-1 text-[11px] text-yellow-400/80">{session.targetLine}</p>
      ) : null}
      {session.whatToRecord.length > 0 ? (
        <p className="mt-2 text-[10px] text-zinc-500">
          <span className="font-semibold text-zinc-400">Record: </span>
          {session.whatToRecord.join(" · ")}
        </p>
      ) : null}
      {session.coachNote ? (
        <p className="mt-1 text-[10px] italic text-zinc-600">{session.coachNote}</p>
      ) : null}
    </article>
  );
}
