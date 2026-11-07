"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionDetail, type SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import type { AthleteSessionMainSetBlock } from "@/app/lib/hyroxAthleteSessionMainSetDisplay";
import { parseMainSetBlocks } from "@/app/lib/hyroxAthleteSessionMainSetDisplay";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import {
  emptyMetricsForActivity,
  type SessionActivityMetrics,
  type SessionActivityType,
  type SessionExecutionFeedbackChips,
  type SessionPlannedTargets,
} from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import { extractPlannedTargets } from "@/app/lib/hyrox-team/modules/sessionLogging/plannedTargets";
import { resolveFeedbackProfile } from "@/app/lib/hyroxSessionExecutionFeedbackConfig";
import {
  SessionExecutionChips,
  executionChipsReady,
} from "./SessionExecutionChips";
import {
  useHyroxSessionLog,
  type HyroxSessionLogForm,
} from "./useHyroxSessionLog";
import { useAthletePortalOptional } from "./athletePortalContext";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { SessionActivityLogFields } from "./SessionActivityLogFields";
import { SessionCompleteConfirm } from "./visual/SessionCompleteConfirm";
import { SessionTarget, SessionTargetRow } from "./visual/SessionTarget";
import { SessionStatusPill } from "./visual-system/primitives/StatusPill";
import { AthleteCoachNote } from "./visual-system/primitives/CoachNote";
import { CompactWorkoutPreview } from "./visual-system/workout/CompactWorkoutPreview";
import { hyroxSessionToProgrammeCardViewModel } from "@/app/lib/visual-system/programmeSessionCardAdapter";
import type { SessionStatusKey } from "./visual-system/tokens";

function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isPastUnloggedSession(session: HyroxSession | null | undefined): boolean {
  if (!session) return false;
  if (session.status !== "upcoming") return false;
  if (!session.dateYmd) return false;
  return session.dateYmd < todayYmdLocal();
}

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

function resolveActivityType(
  session: HyroxSession | null | undefined,
  detail: SessionDetail | null
): SessionActivityType {
  return (
    session?.activityType ??
    session?.plannedTargets?.activityType ??
    inferSessionActivityType({
      category: detail?.categoryTag ?? session?.type ?? null,
      sessionName: session?.name ?? null,
      sessionTypeLabel: session?.type ?? null,
    })
  );
}

function resolvePlanned(
  session: HyroxSession | null | undefined,
  detail: SessionDetail | null,
  activityType: SessionActivityType
): SessionPlannedTargets {
  if (session?.plannedTargets) {
    return {
      ...session.plannedTargets,
      activityType: session.plannedTargets.activityType ?? activityType,
    };
  }
  return extractPlannedTargets({
    detail: session?.detail ?? null,
    category: detail?.categoryTag ?? session?.type,
    sessionName: session?.name,
    activityType,
  });
}

function formFromSession(
  session: HyroxSession | null | undefined,
  detail: SessionDetail | null
): HyroxSessionLogForm {
  const activityType = resolveActivityType(session, detail);
  const planned = resolvePlanned(session, detail, activityType);
  const metrics =
    (session?.activityMetrics as SessionActivityMetrics | null | undefined) ??
    emptyMetricsForActivity(activityType);

  return {
    completed: session?.status === "complete",
    rpe: session?.loggedRpe ?? "",
    notes: session?.logNotes ?? "",
    modifications: session?.logModifications ?? "",
    score: session?.logScore ?? "",
    activityType,
    planned,
    metrics,
    execution: null,
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
  const realCoachNote = (sessionDetail ? sessionDetail.coachNote : session?.coachNote)?.trim() || "";
  const d = useMemo(() => {
    const resolvedDetail = sessionDetail ?? (sessionId ? getSessionDetail(sessionId) : null);
    if (!resolvedDetail) return null;
    return { ...resolvedDetail, coachNote: realCoachNote };
  }, [sessionDetail, sessionId, realCoachNote]);
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const chipsEnabled = Boolean(portal?.sessionExecutionChipsEnabled);
  void adminPreview;
  const {
    saving,
    error,
    successMessage,
    clearMessages,
    saveSessionLog,
  } = useHyroxSessionLog();
  const [showLogForm, setShowLogForm] = useState(initialShowLogForm);
  const [form, setForm] = useState<HyroxSessionLogForm>(() => formFromSession(session, d));
  const [forgottenPhase, setForgottenPhase] = useState<"prompt" | "flow" | "dismissed">(
    "prompt"
  );
  const drawerResetKey = open
    ? `${sessionId}|${initialShowLogForm}|${session?.completedAt ?? ""}|${session?.loggedRpe ?? ""}|${session?.logNotes ?? ""}|${session?.logScore ?? ""}`
    : "closed";
  const [lastDrawerResetKey, setLastDrawerResetKey] = useState(drawerResetKey);

  if (open && drawerResetKey !== lastDrawerResetKey) {
    setLastDrawerResetKey(drawerResetKey);
    setForm(formFromSession(session, d));
    setShowLogForm(initialShowLogForm);
    setForgottenPhase("prompt");
  }

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
    clearMessages();
  }, [open, sessionId, clearMessages]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
        setForm(formFromSession(updated, d));
      }
      onSessionUpdated?.(updated);
    },
    [onSessionUpdated, d]
  );

  const feedbackProfile = useMemo(
    () =>
      resolveFeedbackProfile({
        activityType: form.activityType,
        category: d?.categoryTag ?? session?.type,
        sessionName: session?.name ?? sessionTitle,
        sessionTypeLabel: session?.type,
      }),
    [form.activityType, d?.categoryTag, session?.type, session?.name, sessionTitle]
  );

  const feedbackPayload = useMemo(
    () => ({
      rpe: form.rpe || undefined,
      notes: form.notes || undefined,
      modifications: form.modifications || undefined,
      score: form.score || undefined,
      activityType: form.activityType,
      planned: form.planned ?? null,
      metrics: form.metrics ?? null,
      execution: form.execution ?? null,
    }),
    [form]
  );

  const handleMarkComplete = useCallback(async () => {
    if (!sessionId || !canSave) return;
    if (chipsEnabled) {
      setShowLogForm(true);
      return;
    }
    clearMessages();
    const updated = await saveSessionLog({
      programmeSessionId: sessionId,
      completed: true,
      feedback: feedbackPayload,
    });
    if (updated) handleUpdated(updated);
  }, [
    sessionId,
    canSave,
    chipsEnabled,
    clearMessages,
    saveSessionLog,
    feedbackPayload,
    handleUpdated,
  ]);

  const handleSaveStructured = useCallback(async () => {
    if (!sessionId || !canSave || !form.execution) return;
    if (!executionChipsReady(form.execution, feedbackProfile)) return;
    clearMessages();
    const updated = await saveSessionLog({
      programmeSessionId: sessionId,
      completed: form.execution.completion === "complete",
      feedback: {
        ...feedbackPayload,
        execution: form.execution,
        rpe:
          form.execution.rpe != null
            ? String(form.execution.rpe)
            : feedbackPayload.rpe,
        notes: form.execution.athleteNote ?? feedbackPayload.notes,
        score:
          form.execution.actuals?.primaryResult != null
            ? String(form.execution.actuals.primaryResult)
            : feedbackPayload.score,
      },
    });
    if (updated) handleUpdated(updated);
  }, [
    sessionId,
    canSave,
    form.execution,
    feedbackProfile,
    clearMessages,
    saveSessionLog,
    feedbackPayload,
    handleUpdated,
  ]);

  const handleSaveLog = useCallback(async () => {
    if (!sessionId || !canSave) return;
    clearMessages();
    const updated = await saveSessionLog({
      programmeSessionId: sessionId,
      completed: form.completed,
      feedback: feedbackPayload,
    });
    if (updated) handleUpdated(updated);
  }, [sessionId, canSave, clearMessages, saveSessionLog, form.completed, feedbackPayload, handleUpdated]);

  if (!open || !d) return null;

  const recordFields = d.recordFields ?? ["RPE", "Duration", "Notes"];
  const alreadyLogged =
    session?.status === "complete" ||
    session?.status === "missed" ||
    session?.status === "modified";
  const isComplete = alreadyLogged || form.completed;
  const activityType = form.activityType ?? "other";
  const metrics = form.metrics ?? emptyMetricsForActivity(activityType);
  const showForgotten =
    chipsEnabled &&
    isPastUnloggedSession(session) &&
    forgottenPhase === "prompt" &&
    !alreadyLogged &&
    !successMessage;
  const structuredReady = executionChipsReady(form.execution ?? null, feedbackProfile);

  const cardVm = session ? hyroxSessionToProgrammeCardViewModel(session) : null;
  const statusKey: SessionStatusKey =
    cardVm?.status ??
    (session?.status === "complete" || form.completed
      ? "completed"
      : session?.status === "modified"
        ? "partial"
        : session?.status === "missed"
          ? "missed"
          : "upcoming");
  const categoryLabel = (d.categoryTag || session?.type || "Session").trim();
  const title = sessionTitle ?? session?.name ?? d.categoryTag;
  const primaryTarget =
    cardVm?.primaryTarget?.trim() ||
    d.targetPaceLoad?.trim() ||
    null;
  const durationLabel =
    cardVm?.durationLabel?.trim() ||
    (d.durationMin ? `${d.durationMin} min` : null);
  const timeline = cardVm?.timeline;

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
        data-session-drawer="v0"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden border-l border-[var(--h365-border)] bg-[var(--h365-background)] shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-150 motion-reduce:animate-none"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--h365-border)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                {[categoryLabel, d.weekLabel].filter(Boolean).join(" · ")}
              </p>
              <SessionStatusPill status={statusKey} />
            </div>
            <h2 className="mt-2 font-display text-[1.35rem] font-bold uppercase leading-tight tracking-tight text-[var(--h365-text)] sm:text-2xl">
              {title}
            </h2>
            {primaryTarget ? (
              <p className="mt-2 text-[22px] font-bold tabular-nums leading-none tracking-tight text-[var(--h365-text)] num">
                {primaryTarget}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--h365-text-muted)] num">
              {[durationLabel, d.rpeTarget ? `RPE ${d.rpeTarget}` : null, d.hrZone]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--h365-border)] text-[var(--h365-text-muted)] transition-colors hover:text-[var(--h365-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {timeline?.segments.length ? (
            <section data-session-drawer-timeline="">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                Structure
              </p>
              <div className="mt-3">
                <CompactWorkoutPreview timeline={timeline} />
              </div>
            </section>
          ) : null}

          <SessionTargetRow>
            <SessionTarget label="Duration" value={`${d.durationMin} min`} />
            <SessionTarget label="RPE" value={d.rpeTarget} />
            <SessionTarget label="HR zone" value={d.hrZone} />
          </SessionTargetRow>

          {d.objective ? (
            <Block title="Objective" accent>
              <p className="text-sm leading-relaxed text-[var(--h365-text)]/90">{d.objective}</p>
            </Block>
          ) : null}

          {!timeline?.segments.length ? (
            <>
              <Block title="Warm-up">
                <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-[var(--h365-text-muted)]">
                  {d.warmUp.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </Block>

              <MainSetDisplay
                mainSet={d.mainSet}
                blocks={d.mainSetBlocks ?? parseMainSetBlocks(d.mainSet)}
              />

              {d.stationFocus ? (
                <Block title="Station focus" accent>
                  <p className="text-sm leading-relaxed text-[var(--h365-text)]/90">
                    {d.stationFocus}
                  </p>
                </Block>
              ) : null}

              <Block title="Cool-down">
                <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-[var(--h365-text-muted)]">
                  {d.coolDown.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </Block>
            </>
          ) : (
            <>
              {d.stationFocus ? (
                <Block title="Station focus" accent>
                  <p className="text-sm leading-relaxed text-[var(--h365-text)]/90">
                    {d.stationFocus}
                  </p>
                </Block>
              ) : null}
              <details className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]/60 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--h365-text-muted)]">
                  Full prescription
                </summary>
                <div className="mt-3 space-y-4">
                  <Block title="Warm-up">
                    <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-[var(--h365-text-muted)]">
                      {d.warmUp.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </Block>
                  <MainSetDisplay
                    mainSet={d.mainSet}
                    blocks={d.mainSetBlocks ?? parseMainSetBlocks(d.mainSet)}
                  />
                  <Block title="Cool-down">
                    <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-[var(--h365-text-muted)]">
                      {d.coolDown.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </Block>
                </div>
              </details>
            </>
          )}

          {d.coachNote ? (
            <AthleteCoachNote note={d.coachNote} label="Session cue" />
          ) : null}

          {d.coachPacingNote ? (
            <AthleteCoachNote note={d.coachPacingNote} label="Pacing cue" />
          ) : null}

          {d.filmPrompt ? (
            <div className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-accent)]/90">
                Film prompt
              </p>
              <p className="mt-1.5 text-sm text-[var(--h365-text)]/90">{d.filmPrompt}</p>
            </div>
          ) : null}

          {d.fullPrescription && !timeline?.segments.length ? (
            <Block title="Full session prescription">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--h365-text-muted)]">
                {d.fullPrescription}
              </p>
            </Block>
          ) : null}

          <Block title="What to record">
            <ul className="m-0 space-y-1 text-sm text-[var(--h365-text-muted)]">
              {recordFields.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </Block>

          {chipsEnabled ? (
            <SessionExecutionChips
              profile={feedbackProfile}
              value={form.execution ?? null}
              forgottenPrompt={showForgotten}
              onForgottenChoice={(choice) => {
                if (choice === "later") {
                  setForgottenPhase("dismissed");
                  onClose();
                  return;
                }
                setForgottenPhase("flow");
                if (choice === "no") {
                  setForm((f) => ({
                    ...f,
                    execution: { completion: "missed", missedReason: null, athleteNote: null },
                  }));
                } else {
                  setForm((f) => ({
                    ...f,
                    execution: f.execution?.completion
                      ? f.execution
                      : { completion: "complete", pain: null, rpe: null },
                  }));
                }
              }}
              onChange={(execution: SessionExecutionFeedbackChips) =>
                setForm((f) => ({
                  ...f,
                  execution,
                  completed: execution.completion === "complete",
                  rpe: execution.rpe != null ? String(execution.rpe) : f.rpe,
                  notes: execution.athleteNote ?? f.notes,
                }))
              }
            />
          ) : null}

          {showLogForm && !chipsEnabled ? (
            <div className="space-y-3 rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-accent)]/90">
                Log session
              </p>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--h365-text)]">
                <input
                  type="checkbox"
                  checked={form.completed}
                  disabled={!canSave}
                  onChange={(e) => setForm((f) => ({ ...f, completed: e.target.checked }))}
                  className="rounded border-[var(--h365-border)]"
                />
                Mark as completed
              </label>

              <SessionActivityLogFields
                activityType={activityType}
                planned={form.planned ?? null}
                metrics={metrics}
                disabled={!canSave}
                onChange={(nextMetrics) =>
                  setForm((f) => ({
                    ...f,
                    metrics: nextMetrics,
                    rpe:
                      activityType === "strength"
                        ? String((nextMetrics as { sessionRpe?: string }).sessionRpe ?? f.rpe)
                        : String((nextMetrics as { rpe?: string }).rpe ?? f.rpe),
                    notes: String((nextMetrics as { notes?: string }).notes ?? f.notes),
                  }))
                }
              />

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
              <Field label="Time / score summary (optional)">
                <input
                  type="text"
                  disabled={!canSave}
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                  className={inputClass}
                  placeholder="Quick summary if useful for coach scan"
                />
              </Field>
            </div>
          ) : null}

          {showLogForm && chipsEnabled ? (
            <details className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]/60 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--h365-text-muted)]">
                Extra metrics (optional)
              </summary>
              <div className="mt-3">
                <SessionActivityLogFields
                  activityType={activityType}
                  planned={form.planned ?? null}
                  metrics={metrics}
                  disabled={!canSave}
                  onChange={(nextMetrics) =>
                    setForm((f) => ({
                      ...f,
                      metrics: nextMetrics,
                    }))
                  }
                />
              </div>
            </details>
          ) : null}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-[var(--h365-border)] bg-[var(--h365-background)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {blockedReason ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
              {blockedReason}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-[var(--h365-danger)]/35 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <SessionCompleteConfirm
              rpe={form.rpe}
              execution={form.execution?.execution ?? null}
              notes={form.notes}
              actuals={form.score.trim() ? [{ label: "Score", value: form.score }] : undefined}
            />
          ) : null}

          {chipsEnabled ? (
            <>
              <button
                type="button"
                disabled={!canSave || alreadyLogged || showForgotten || !structuredReady}
                onClick={() => void handleSaveStructured()}
                className="min-h-11 w-full rounded-lg bg-[var(--h365-accent)] py-3 text-sm font-semibold text-[var(--h365-background)] transition-transform duration-150 active:scale-[0.99] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : alreadyLogged
                    ? "Already logged"
                    : form.execution?.completion === "missed"
                      ? "Save missed"
                      : "Save feedback"}
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  clearMessages();
                  setShowLogForm((v) => !v);
                }}
                className="min-h-11 w-full rounded-lg border border-[var(--h365-border)] py-2.5 text-sm font-semibold text-[var(--h365-text)] transition-colors hover:bg-[var(--h365-surface)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showLogForm ? "Hide extra metrics" : "Add extra metrics"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!canSave || isComplete}
                onClick={() => void handleMarkComplete()}
                className="min-h-11 w-full rounded-lg bg-[var(--h365-accent)] py-3 text-sm font-semibold text-[var(--h365-background)] transition-transform duration-150 active:scale-[0.99] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="min-h-11 rounded-lg border border-[var(--h365-border)] py-2.5 text-sm font-semibold text-[var(--h365-text)] transition-colors hover:bg-[var(--h365-surface)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showLogForm ? "Hide log" : "Log session"}
                </button>
                <button
                  type="button"
                  disabled={!canSave || !showLogForm}
                  onClick={() => void handleSaveLog()}
                  className="min-h-11 rounded-lg border border-[var(--h365-accent)]/40 py-2.5 text-sm font-semibold text-[var(--h365-accent)] transition-colors hover:bg-[var(--h365-accent)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save log"}
                </button>
              </div>
              {showLogForm ? (
                <p className="text-[11px] leading-snug text-[var(--h365-text-muted)]">
                  Save log stores feedback only. Use Mark complete (or tick Mark as completed) to
                  change session status.
                </p>
              ) : null}
            </>
          )}
        </footer>
      </aside>
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-2 text-sm text-[var(--h365-text)] placeholder:text-[var(--h365-text-muted)] focus:border-[var(--h365-accent)]/50 focus:outline-none disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[var(--h365-text-muted)]">
      {label}
      {children}
    </label>
  );
}

function MainSetDisplay({
  mainSet,
  blocks,
}: {
  mainSet: string[];
  blocks: AthleteSessionMainSetBlock[] | null;
}) {
  if (blocks && blocks.length >= 2) {
    return (
      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.title}
            className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-accent)]/90">
              {block.title}
            </p>
            {block.lines.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {block.lines.map((line) => (
                  <li
                    key={`${block.title}-${line}`}
                    className="text-sm leading-relaxed text-[var(--h365-text)]/90"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-accent)]/90">
        Main set
      </p>
      <ul className="mt-2 space-y-2">
        {mainSet.map((l, i) => (
          <li
            key={l}
            className={
              i === 0 && mainSet.length === 1
                ? "text-base font-bold text-[var(--h365-text)]"
                : "text-sm leading-relaxed text-[var(--h365-text)]/90"
            }
          >
            {l}
          </li>
        ))}
      </ul>
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
    <div
      className={
        accent
          ? "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] p-4"
          : ""
      }
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
          accent ? "text-[var(--h365-accent)]/90" : "text-[var(--h365-text-muted)]"
        }`}
      >
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
