"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdaptationVerb } from "@/app/lib/hyroxAdaptationTypes";
import { deriveLiveGlobalWeek } from "@/app/lib/hyroxProgrammeDates";
import type {
  HyroxWeeklyCoachNotes,
  HyroxWeeklyReviewPayload,
  WeeklyReviewAlert,
} from "@/app/lib/hyroxWeeklyReview";
import { emptyWeeklyCoachNotes, isHighRpeForDisplay } from "@/app/lib/hyroxWeeklyReview";
import { DashCard, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";

type CoachNoteTextKey = Exclude<keyof HyroxWeeklyCoachNotes, "adaptationDecisions">;

const COACH_NOTE_FIELDS: { key: CoachNoteTextKey; label: string; rows: number }[] = [
  { key: "coachObservations", label: "Coach observations", rows: 3 },
  { key: "adjustmentsForNextWeek", label: "Adjustments for next week", rows: 3 },
  { key: "followUpMessageNeeded", label: "Follow-up message needed", rows: 2 },
  { key: "sessionChangesRequired", label: "Session changes required", rows: 2 },
];

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600";
}

function calendarStatusLabel(status: HyroxWeeklyReviewPayload["summary"]["calendarStatus"]): string {
  if (status === "live") return "Live";
  if (status === "past") return "Past";
  if (status === "upcoming") return "Upcoming";
  return "Not published";
}

function calendarStatusClass(status: HyroxWeeklyReviewPayload["summary"]["calendarStatus"]): string {
  if (status === "live") return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
  if (status === "past") return "bg-zinc-700/40 text-zinc-400 ring-zinc-600/40";
  if (status === "upcoming") return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
  return "bg-zinc-800 text-zinc-500 ring-zinc-700";
}

function alertClass(alert: WeeklyReviewAlert): string {
  if (alert.severity === "critical") return "border-red-500/40 bg-red-500/10 text-red-200";
  if (alert.severity === "warn") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-zinc-600 bg-zinc-800/60 text-zinc-300";
}

function sessionStatusBadge(session: HyroxWeeklyReviewPayload["sessions"][number]) {
  if (session.completed) {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
        Completed
      </span>
    );
  }
  if (session.status === "missed") {
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
        Missed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
      No log yet
    </span>
  );
}

export function CoachWeeklyReviewPanel({
  athleteId,
  programmeStartDate = null,
  programmeLengthWeeks = 12,
  suggestedWeek,
  onOpenWeekComposer,
}: {
  athleteId: string;
  programmeStartDate?: string | null;
  programmeLengthWeeks?: number;
  suggestedWeek?: number;
  /** Jump to Week Composer with this review week as source */
  onOpenWeekComposer?: (sourceWeek: number) => void;
}) {
  const maxWeeks = programmeLengthWeeks === 16 ? 16 : 12;
  const defaultWeek = useMemo(() => {
    if (suggestedWeek && suggestedWeek >= 1 && suggestedWeek <= maxWeeks) {
      return suggestedWeek;
    }
    if (programmeStartDate) {
      try {
        return Math.min(maxWeeks, Math.max(1, deriveLiveGlobalWeek(programmeStartDate)));
      } catch {
        return 1;
      }
    }
    return 1;
  }, [suggestedWeek, programmeStartDate, maxWeeks]);

  const [weekNumber, setWeekNumber] = useState(defaultWeek);
  const [review, setReview] = useState<HyroxWeeklyReviewPayload | null>(null);
  const [coachNotes, setCoachNotes] = useState<HyroxWeeklyCoachNotes>(emptyWeeklyCoachNotes());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);

  const weekOptions = useMemo(() => {
    const publishedMax = review?.availableWeeks.length
      ? Math.max(...review.availableWeeks)
      : 0;
    const liveCap = programmeStartDate
      ? Math.min(maxWeeks, Math.max(1, deriveLiveGlobalWeek(programmeStartDate)))
      : 4;
    const cap = Math.min(maxWeeks, Math.max(4, publishedMax, liveCap, weekNumber));
    return Array.from({ length: cap }, (_, i) => i + 1);
  }, [review?.availableWeeks, maxWeeks, weekNumber, programmeStartDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/hyrox/athletes/${athleteId}/weekly-review?week=${weekNumber}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not load weekly review.");
        setReview(null);
        return;
      }
      const payload = data.review as HyroxWeeklyReviewPayload;
      setReview(payload);
      setCoachNotes(payload.coachNotes ?? emptyWeeklyCoachNotes());
    } catch {
      setError("Network error loading weekly review.");
      setReview(null);
    } finally {
      setLoading(false);
    }
  }, [athleteId, weekNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveNotes = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/weekly-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_number: weekNumber,
          programme_week_id: review?.summary.programmeWeekId ?? null,
          coach_notes: coachNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not save coach notes.");
        return;
      }
      setCoachNotes(data.coachNotes ?? coachNotes);
      setToast(data.message ?? "Saved.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Network error saving coach notes.");
    } finally {
      setSaving(false);
    }
  };

  const summary = review?.summary;
  const adaptation = review?.adaptation;

  async function recordDecision(sessionId: string, coachVerb: AdaptationVerb) {
    setDecisionBusy(`${sessionId}:${coachVerb}`);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/weekly-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_number: weekNumber,
          programme_week_id: review?.summary.programmeWeekId ?? null,
          action: "record_adaptation_decision",
          sessionId,
          coachVerb,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not record decision.");
        return;
      }
      setToast(data.message ?? "Decision recorded — programme unchanged.");
      setTimeout(() => setToast(null), 4000);
      await load();
    } catch {
      setError("Network error recording decision.");
    } finally {
      setDecisionBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Weekly Review</h3>
          <p className="text-sm text-zinc-500">
            Session logs, weekly check-in and coach notes for one programme week.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {weekOptions.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeekNumber(w)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                weekNumber === w
                  ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/40"
                  : "text-zinc-500 ring-1 ring-zinc-700 hover:text-zinc-300"
              }`}
            >
              Week {w}
            </button>
          ))}
        </div>
      </div>

      {toast ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-zinc-500">Loading week {weekNumber}…</p> : null}

      {!loading && summary ? (
        <>
          <DashCard highlight>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SectionHeading title={`Week ${summary.weekNumber} summary`} />
                {summary.dateRangeLabel ? (
                  <p className="text-sm text-zinc-400">{summary.dateRangeLabel}</p>
                ) : null}
                {summary.weeklyFocus ? (
                  <p className="mt-1 text-sm text-zinc-500">Focus: {summary.weeklyFocus}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenWeekComposer ? (
                  <button
                    type="button"
                    onClick={() => onOpenWeekComposer(weekNumber)}
                    className="rounded-full border border-yellow-500/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-100"
                  >
                    Compose next week
                  </button>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ring-1 ${calendarStatusClass(summary.calendarStatus)}`}
                >
                  {calendarStatusLabel(summary.calendarStatus)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Sessions completed"
                value={`${summary.sessionsCompleted} / ${summary.sessionsTotal}`}
              />
              <StatTile label="Completion" value={`${summary.completionPercent}%`} />
              <StatTile
                label="Average RPE"
                value={summary.averageRpe != null ? String(summary.averageRpe) : "—"}
              />
              <StatTile label="Sessions with notes" value={String(summary.sessionsWithNotes)} />
              <StatTile label="Missed / incomplete" value={String(summary.missedOrIncomplete)} />
              <StatTile
                label="Check-in"
                value={
                  summary.checkInStatus === "completed"
                    ? "Completed"
                    : summary.published
                      ? "Needs completing"
                      : "—"
                }
              />
              {summary.checkInSubmittedAt ? (
                <StatTile
                  label="Check-in submitted"
                  value={new Date(summary.checkInSubmittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                />
              ) : null}
            </div>

            {!summary.published ? (
              <p className="mt-4 text-sm text-zinc-500">
                This week has not been published yet. Session logs will appear once the week is
                live.
              </p>
            ) : null}
          </DashCard>

          {review.alerts.length > 0 ? (
            <DashCard>
              <SectionHeading title="Coach alerts" />
              <ul className="space-y-2">
                {review.alerts.map((alert) => (
                  <li
                    key={alert.code}
                    className={`rounded-lg border px-3 py-2 text-sm ${alertClass(alert)}`}
                  >
                    {alert.message}
                  </li>
                ))}
              </ul>
            </DashCard>
          ) : null}

          {adaptation ? (
            <DashCard>
              <SectionHeading title="Execution & adaptation" />
              <p className="mb-3 text-sm text-zinc-500">
                System recommendations only. Accepting a decision records an audit — it does not
                change the published programme.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Complete / partial / missed"
                  value={`${adaptation.summary.completed} / ${adaptation.summary.partial} / ${adaptation.summary.missed}`}
                />
                <StatTile
                  label="Unresolved"
                  value={String(adaptation.summary.unresolved)}
                />
                <StatTile
                  label="Avg session RPE"
                  value={
                    adaptation.summary.averageSessionRpe != null
                      ? String(adaptation.summary.averageSessionRpe)
                      : "—"
                  }
                />
                <StatTile
                  label="Quality done"
                  value={`${adaptation.summary.qualitySessionCompletion.completedOrPartial} / ${adaptation.summary.qualitySessionCompletion.planned}`}
                />
              </div>
              {adaptation.summary.painFlags.length ? (
                <p className="mt-3 text-sm text-amber-200">
                  Pain flags:{" "}
                  {adaptation.summary.painFlags
                    .map((p) => `${p.sessionName} (${p.pain})`)
                    .join(" · ")}
                </p>
              ) : null}
              {adaptation.recommendations.length ? (
                <ul className="mt-4 space-y-3">
                  {adaptation.recommendations.map((rec) => {
                    const session = adaptation.sessions.find((s) => s.sessionId === rec.sessionId);
                    const prior = (adaptation.decisions ?? []).filter(
                      (d) => d.sessionId === rec.sessionId
                    );
                    return (
                      <li
                        key={rec.sessionId}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                              Recommendation
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {session?.sessionName ?? rec.sessionId}
                            </p>
                            <p className="mt-1 text-lg font-bold text-yellow-300">{rec.verb}</p>
                            <p className="text-xs text-zinc-500">
                              Confidence {rec.confidence}
                              {rec.suggestedNext?.toStageLabel
                                ? ` · Suggested next: ${rec.suggestedNext.toStageLabel}`
                                : ""}
                              {rec.autoApplyForbidden ? " · Auto-apply forbidden" : ""}
                            </p>
                            {rec.automationEligibility ? (
                              <p className="mt-1 text-[11px] text-zinc-500">
                                Automation:{" "}
                                <span
                                  className={
                                    rec.automationEligibility.allowed
                                      ? "text-emerald-300"
                                      : "text-amber-300"
                                  }
                                >
                                  {rec.automationEligibility.class}
                                </span>
                                {rec.automationEligibility.allowed
                                  ? " (Track-ready later — 1-1 still coach decides)"
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rec.executionSummary?.source === "structured" ? (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                                Structured
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                                Legacy / missing chips
                              </span>
                            )}
                            {!rec.fitnessPenalty ? (
                              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-300">
                                No fitness penalty
                              </span>
                            ) : null}
                            {rec.escalateToCoach ? (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                                Review
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                          {rec.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                        {rec.athleteExplanation ? (
                          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                              Athlete explanation preview
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-200">
                              {rec.athleteExplanation.title}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {rec.athleteExplanation.summary}
                            </p>
                            {rec.athleteExplanation.change ? (
                              <p className="mt-1 text-xs text-yellow-200/80">
                                {rec.athleteExplanation.change}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {rec.coachOptions.slice(0, 6).map((verb) => (
                            <button
                              key={verb}
                              type="button"
                              disabled={Boolean(decisionBusy)}
                              onClick={() => void recordDecision(rec.sessionId, verb)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                                verb === rec.verb
                                  ? "border-yellow-500/50 bg-yellow-400/10 text-yellow-100"
                                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                              } disabled:opacity-50`}
                            >
                              {decisionBusy === `${rec.sessionId}:${verb}`
                                ? "Saving…"
                                : verb === rec.verb
                                  ? `Accept ${verb}`
                                  : verb}
                            </button>
                          ))}
                        </div>
                        {prior.length ? (
                          <p className="mt-2 text-[11px] text-zinc-600">
                            Prior decisions:{" "}
                            {prior
                              .map(
                                (d) =>
                                  `${d.coachVerb} @ ${new Date(d.decidedAt).toLocaleString("en-GB")}`
                              )
                              .join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">
                  No logged sessions with feedback to recommend on yet.
                </p>
              )}
            </DashCard>
          ) : null}

          <DashCard>
            <SectionHeading title="Session logs" />
            {review.sessions.length === 0 ? (
              <p className="text-sm text-zinc-500">No published sessions for this week.</p>
            ) : (
              <ul className="space-y-3">
                {review.sessions.map((session) => (
                  <li
                    key={session.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{session.sessionName}</p>
                          {session.isKeySession ? (
                            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-300">
                              Key
                            </span>
                          ) : null}
                          {sessionStatusBadge(session)}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {session.dateLabel ?? session.dayOfWeek} · {session.sessionSlot} ·{" "}
                          {session.sessionType}
                          {session.plannedDuration ? ` · ${session.plannedDuration}` : ""}
                        </p>
                      </div>
                      {session.rpe ? (
                        <span
                          className={`text-sm font-bold ${
                            isHighRpeForDisplay(session.rpeNumeric) ? "text-amber-300" : "text-zinc-300"
                          }`}
                        >
                          RPE {session.rpe}
                        </span>
                      ) : null}
                    </div>

                    {session.completedAt ? (
                      <p className="mt-2 text-xs text-zinc-600">
                        Completed{" "}
                        {new Date(session.completedAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}

                    {session.notes ? (
                      <p className="mt-2 text-sm text-zinc-400">
                        <span className="text-zinc-600">Notes: </span>
                        {session.notes}
                      </p>
                    ) : null}
                    {session.modifications ? (
                      <p className="mt-1 text-sm text-zinc-500">
                        <span className="text-zinc-600">Modifications: </span>
                        {session.modifications}
                      </p>
                    ) : null}
                    {session.score ? (
                      <p className="mt-1 text-xs text-zinc-500">Score: {session.score}</p>
                    ) : null}
                    {!session.completed && !session.notes && !session.rpe ? (
                      <p className="mt-2 text-sm italic text-zinc-600">No log yet</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </DashCard>

          <DashCard>
            <SectionHeading title="Weekly check-in" />
            {review.checkIn ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <CheckInMetric label="Sleep" value={review.checkIn.sleep} />
                <CheckInMetric label="Energy" value={review.checkIn.energy} />
                <CheckInMetric label="Stress" value={review.checkIn.stress} />
                <CheckInMetric label="Soreness" value={review.checkIn.soreness} />
                <CheckInMetric label="Recovery" value={review.checkIn.recovery} />
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-zinc-600">Bodyweight</dt>
                  <dd className="mt-0.5 text-sm text-zinc-300">
                    {review.checkIn.bodyweight != null ? `${review.checkIn.bodyweight} kg` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-zinc-600">
                    Sessions completed (check-in)
                  </dt>
                  <dd className="mt-0.5 text-sm text-zinc-300">
                    {review.checkIn.sessionsCompleted ?? "—"}
                  </dd>
                </div>
                <CheckInText label="What went well" value={review.checkIn.biggestWin} />
                <CheckInText label="What was difficult" value={review.checkIn.biggestStruggle} />
                <CheckInText label="Pain / injury notes" value={review.checkIn.painNiggles} warn />
                <CheckInText
                  label="Adjustments / availability"
                  value={review.checkIn.nextWeekAvailability}
                />
                {review.checkIn.submittedAt ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase text-zinc-600">Submitted</dt>
                    <dd className="mt-0.5 text-sm text-zinc-400">
                      {new Date(review.checkIn.submittedAt).toLocaleString("en-GB")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">Weekly check-in not submitted yet.</p>
            )}
          </DashCard>

          <DashCard>
            <SectionHeading title="Coach review notes" />
            <p className="mb-4 text-sm text-zinc-500">
              Private coach notes for week {weekNumber}.
              {review.coachReviewUpdatedAt
                ? ` Last saved ${new Date(review.coachReviewUpdatedAt).toLocaleString("en-GB")}.`
                : ""}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {COACH_NOTE_FIELDS.map((field) => (
                <label key={field.key} className="block text-xs text-zinc-500 lg:col-span-1">
                  {field.label}
                  <textarea
                    value={coachNotes[field.key] ?? ""}
                    onChange={(e) =>
                      setCoachNotes((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={field.rows}
                    className={inputClass()}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void saveNotes()}
              disabled={saving}
              className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save coach notes"}
            </button>
          </DashCard>
        </>
      ) : null}
    </div>
  );
}

function CheckInMetric({ label, value }: { label: string; value: number | null }) {
  const low = value != null && value <= 4;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase text-zinc-600">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold ${low ? "text-amber-300" : "text-zinc-300"}`}>
        {value != null ? `${value}/10` : "—"}
      </dd>
    </div>
  );
}

function CheckInText({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | null;
  warn?: boolean;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="sm:col-span-2">
      <dt className="text-[10px] font-semibold uppercase text-zinc-600">{label}</dt>
      <dd
        className={`mt-1 text-sm leading-relaxed ${warn ? "text-red-200" : "text-zinc-400"}`}
      >
        {value}
      </dd>
    </div>
  );
}
