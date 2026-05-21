"use client";

import { CheckCircle2, Clock, Gauge, Heart, Share2, Timer, X } from "lucide-react";
import type { MemberSessionLogRecord } from "@/app/lib/memberSessionLog";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";

export type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";

type Props = {
  open: boolean;
  session: MemberSessionDrawerSession | null;
  onClose: () => void;
  log: MemberSessionLogRecord | undefined;
  draftRpe: number | null;
  onDraftRpeChange: (value: number) => void;
  draftNotes: string;
  onDraftNotesChange: (value: string) => void;
  saving: boolean;
  saveError: string | null;
  programmeInstanceId: string | null;
  onSaveComplete: () => void;
  onSaveIncomplete: () => void;
  onShare?: () => void;
};

export function MemberSessionDetailDrawer({
  open,
  session,
  onClose,
  log,
  draftRpe,
  onDraftRpeChange,
  draftNotes,
  onDraftNotesChange,
  saving,
  saveError,
  programmeInstanceId,
  onSaveComplete,
  onSaveIncomplete,
  onShare,
}: Props) {
  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close session details"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[min(92vh,900px)] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40 sm:max-h-[90vh]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-600" />
        <div className="mx-auto max-w-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-12">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400">{session.day}</p>
              <span className="text-sm font-medium text-zinc-300">
                {session.priorityDisplayLabel} — {session.priorityCategoryLabel}
              </span>
              <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{session.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">{session.intent}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-zinc-800 bg-zinc-800 p-2.5 text-zinc-300 hover:bg-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Timer className="h-4 w-4" />
                Duration
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.duration}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Clock className="h-4 w-4" />
                Time cap
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.timeCap || "—"}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Gauge className="h-4 w-4" />
                Guide
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{session.rpeGuide}</p>
            </div>
          </div>

          {(session.category === "Run" || session.category === "Hybrid") && session.runPrescription ? (
            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-zinc-900/80 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400/90">
                Your intensity guide
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {session.runPrescription.effort_description}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {session.runPrescription.pace_range ? (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Target pace</p>
                    <p className="mt-1 text-base font-semibold text-white">{session.runPrescription.pace_range}</p>
                  </div>
                ) : null}
                {session.runPrescription.hr_range ? (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <Heart className="h-3.5 w-3.5" />
                      HR guide
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">{session.runPrescription.hr_range}</p>
                  </div>
                ) : null}
                <div
                  className={`rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3${
                    !session.runPrescription.pace_range && !session.runPrescription.hr_range ? " sm:col-span-2" : ""
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    <Gauge className="h-3.5 w-3.5" />
                    RPE
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">{session.runPrescription.rpe}</p>
                </div>
              </div>
              {session.runPrescription.coach_note ? (
                <p className="mt-4 border-t border-zinc-800/80 pt-4 text-sm leading-relaxed text-zinc-300">
                  {session.runPrescription.coach_note}
                </p>
              ) : null}
            </div>
          ) : null}

          {[
            ["Warm-up", session.warmUp],
            ["Main work", session.mainWork],
            ["Cool-down", session.coolDown],
            ["Finish", session.finisher],
            ["Coaching notes", session.coachingNotes ? [session.coachingNotes] : []],
          ].map(([label, lines]) =>
            Array.isArray(lines) && lines.length > 0 ? (
              <div key={String(label)} className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm font-bold text-white">{String(label)}</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                  {lines.map((line) => (
                    <li key={line}>
                      <span className="text-yellow-400">·</span> {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}

          {session.doubleSession ? (
            <div className="mt-5 rounded-xl border border-blue-500/25 bg-blue-950/20 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                  {session.doubleSession.label}
                </span>
                <p className="text-sm font-bold text-white">{session.doubleSession.title}</p>
                <span className="ml-auto text-xs text-zinc-500">{session.doubleSession.time_cap_minutes} min</span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-zinc-400">{session.doubleSession.intent}</p>
              {session.doubleSession.main.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-zinc-300">
                  {session.doubleSession.main.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="shrink-0 text-blue-400">·</span>
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">Session log</p>
              {log?.completed ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : (
                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400">
                  Not completed
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">RPE</p>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onDraftRpeChange(value)}
                    className={`min-h-[40px] rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      draftRpe === value
                        ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700/60"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
              <textarea
                value={draftNotes}
                onChange={(e) => onDraftNotesChange(e.target.value)}
                rows={4}
                placeholder="Optional notes about this session..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-700/60"
              />
            </div>

            {saveError ? <p className="mt-3 text-sm text-red-300">{saveError}</p> : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={saving || !programmeInstanceId}
                aria-busy={saving}
                onClick={onSaveComplete}
                className="min-h-[44px] flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : log?.completed ? "Save changes" : "Mark complete"}
              </button>
              <button
                type="button"
                disabled={saving || !programmeInstanceId}
                aria-busy={saving}
                onClick={onSaveIncomplete}
                className="min-h-[44px] rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save as incomplete
              </button>
            </div>

            {onShare ? (
              log?.completed ? (
                <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-400/[0.06] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/95">Share your session</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Opens a clean, screenshot-ready card — story tips appear on the next screen.
                  </p>
                  <button
                    type="button"
                    onClick={onShare}
                    className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-yellow-500/35 bg-yellow-400/10 py-2.5 text-sm font-semibold text-yellow-200 transition hover:border-yellow-400/55 hover:bg-yellow-400/15"
                  >
                    <Share2 className="h-4 w-4 shrink-0" />
                    View Share Card
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onShare}
                  className="mt-4 w-full text-center text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
                >
                  Preview share card
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
