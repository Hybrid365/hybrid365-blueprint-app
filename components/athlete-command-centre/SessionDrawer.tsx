"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSessionDetail, type SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import {
  useHyroxSessionLog,
  type HyroxSessionLogForm,
} from "./useHyroxSessionLog";

type Props = {
  sessionId: string | null;
  session?: HyroxSession | null;
  sessionTitle?: string;
  sessionDetail?: SessionDetail | null;
  /** When false, buttons are disabled with loggingBlockedMessage. */
  loggingEnabled?: boolean;
  loggingBlockedMessage?: string;
  /** When false (mock preview), saving is disabled with a clear message. */
  useLiveApi?: boolean;
  /** Open with log form expanded (e.g. Log result from programme card). */
  initialShowLogForm?: boolean;
  onClose: () => void;
  onSessionUpdated?: (session: HyroxSession | null) => void;
};

function formFromSession(session: HyroxSession | null | undefined): HyroxSessionLogForm {
  return {
    completed: session?.status === "complete",
    rpe: session?.loggedRpe ?? "",
    notes: session?.logNotes ?? "",
    modifications: session?.logModifications ?? "",
    score: session?.logScore ?? "",
  };
}

export function SessionDrawer({
  sessionId,
  session,
  sessionTitle,
  sessionDetail,
  loggingEnabled = true,
  loggingBlockedMessage,
  useLiveApi = true,
  initialShowLogForm = false,
  onClose,
  onSessionUpdated,
}: Props) {
  const open = Boolean(sessionId);
  const d = sessionDetail ?? (sessionId ? getSessionDetail(sessionId) : null);
  const {
    saving,
    error,
    successMessage,
    clearMessages,
    saveSessionLog,
  } = useHyroxSessionLog();
  const [showLogForm, setShowLogForm] = useState(initialShowLogForm);
  const [form, setForm] = useState<HyroxSessionLogForm>(() => formFromSession(session));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setForm(formFromSession(session));
    setShowLogForm(initialShowLogForm);
    clearMessages();
  }, [open, sessionId, session, initialShowLogForm, clearMessages]);

  const canSave =
    useLiveApi &&
    loggingEnabled &&
    Boolean(sessionId) &&
    !saving;

  const blockedReason = !useLiveApi
    ? "Session logging isn't available in preview mode."
    : !loggingEnabled
      ? loggingBlockedMessage ?? "This session cannot be logged yet."
      : null;

  const handleUpdated = useCallback(
    (updated: HyroxSession | null) => {
      if (updated) {
        setForm(formFromSession(updated));
      }
      onSessionUpdated?.(updated);
    },
    [onSessionUpdated]
  );

  const handleMarkComplete = useCallback(async () => {
    if (!sessionId || !canSave) return;
    clearMessages();
    const updated = await saveSessionLog({
      programmeSessionId: sessionId,
      completed: true,
      feedback: {
        rpe: form.rpe || undefined,
        notes: form.notes || undefined,
        modifications: form.modifications || undefined,
        score: form.score || undefined,
      },
    });
    if (updated) handleUpdated(updated);
  }, [sessionId, canSave, clearMessages, saveSessionLog, form, handleUpdated]);

  const handleSaveLog = useCallback(async () => {
    if (!sessionId || !canSave) return;
    clearMessages();
    const updated = await saveSessionLog({
      programmeSessionId: sessionId,
      completed: form.completed,
      feedback: form,
    });
    if (updated) handleUpdated(updated);
  }, [sessionId, canSave, clearMessages, saveSessionLog, form, handleUpdated]);

  if (!open || !d) return null;

  const recordFields = d.recordFields ?? ["RPE", "Duration", "Notes"];
  const isComplete = session?.status === "complete" || form.completed;

  return (
    <>
      <button
        type="button"
        aria-label="Close session"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">{d.weekLabel}</p>
            <h2 className="mt-1 text-xl font-bold text-white">{sessionTitle ?? session?.name ?? d.categoryTag}</h2>
            {isComplete ? (
              <p className="mt-1 text-xs font-semibold text-emerald-400">Completed</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 p-2 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Meta label="Duration" value={`${d.durationMin} min`} />
            <Meta label="RPE" value={d.rpeTarget} />
            <Meta label="HR zone" value={d.hrZone} />
          </div>

          <Block title="Objective" accent>
            <p className="text-sm leading-relaxed text-zinc-300">{d.objective}</p>
          </Block>

          <Block title="Target pace / load">
            <p className="text-sm text-zinc-300">{d.targetPaceLoad}</p>
          </Block>

          <Block title="Warm-up">
            <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-zinc-300">
              {d.warmUp.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Block>

          <div className="rounded-xl border border-yellow-500/30 bg-yellow-400/5 p-4">
            <p className="text-xs font-bold uppercase text-yellow-400">Main set</p>
            <ul className="mt-2 space-y-2">
              {d.mainSet.map((l, i) => (
                <li key={l} className={i === 0 ? "text-base font-bold text-white" : "text-sm text-zinc-400"}>
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <Block title="Cool-down">
            <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-zinc-300">
              {d.coolDown.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Block>

          <Block title="Coach note">
            <p className="text-sm leading-relaxed text-zinc-300">{d.coachNote}</p>
          </Block>

          {d.coachPacingNote ? (
            <Block title="Coach pacing note">
              <p className="text-sm leading-relaxed text-zinc-300">{d.coachPacingNote}</p>
            </Block>
          ) : null}

          {d.filmPrompt ? (
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3">
              <p className="text-[10px] font-bold uppercase text-blue-300">Film prompt</p>
              <p className="mt-1 text-sm text-zinc-300">{d.filmPrompt}</p>
            </div>
          ) : null}

          <Block title="What to record">
            <ul className="m-0 space-y-1 text-sm text-zinc-400">
              {recordFields.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </Block>

          {showLogForm ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-yellow-400">Log session</p>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.completed}
                  disabled={!canSave}
                  onChange={(e) => setForm((f) => ({ ...f, completed: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                Mark as completed
              </label>
              <Field label="RPE (actual)">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 7"
                  disabled={!canSave}
                  value={form.rpe}
                  onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Session notes">
                <textarea
                  rows={3}
                  disabled={!canSave}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputClass}
                  placeholder="How it felt, pacing, anything your coach should know"
                />
              </Field>
              <Field label="Modifications">
                <textarea
                  rows={2}
                  disabled={!canSave}
                  value={form.modifications}
                  onChange={(e) => setForm((f) => ({ ...f, modifications: e.target.value }))}
                  className={inputClass}
                  placeholder="Scaled, substituted, or cut anything?"
                />
              </Field>
              <Field label="Time / score (optional)">
                <input
                  type="text"
                  disabled={!canSave}
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                  className={inputClass}
                  placeholder="Finish time, splits, load, etc."
                />
              </Field>
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-zinc-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {blockedReason ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
              {blockedReason}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-lg border border-emerald-500/35 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
              {successMessage}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canSave || isComplete}
            onClick={() => void handleMarkComplete()}
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : isComplete ? "Already complete" : "Mark complete"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => {
                clearMessages();
                setShowLogForm((v) => !v);
              }}
              className="rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showLogForm ? "Hide log" : "Log session"}
            </button>
            <button
              type="button"
              disabled={!canSave || !showLogForm}
              onClick={() => void handleSaveLog()}
              className="rounded-xl border border-yellow-400/40 py-2.5 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save log"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-yellow-400/50 focus:outline-none disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-zinc-400">
      {label}
      {children}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="font-bold text-white">{value}</p>
    </div>
  );
}

function Block({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "rounded-xl border border-zinc-800 bg-zinc-900/60 p-4" : ""}>
      <p className={`text-xs font-bold uppercase ${accent ? "text-yellow-400" : "text-zinc-500"}`}>{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
