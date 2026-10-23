"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { CoachAttentionFlag } from "@/app/lib/hyroxCoachAttention";
import type { HyroxCommandCentrePayload } from "@/app/lib/hyroxCommandCentreTypes";
import type { AthleteTab } from "@/components/admin-hyrox-athletes/CoachAthleteDashboard";

const UNAVAILABLE = "Unavailable";
const EMPTY_PROGRESS =
  "Rolling 4-week volume, modality mix, and benchmark series come from Workstream B when present.";
const UNPUBLISHED_WEEK =
  "This week's programme is not published. Draft sessions are not shown as athlete results.";
const NO_LIVE_ATHLETE =
  "Command Centre uses live athlete rows only. Open an accepted athlete from the roster.";
const NO_ATTENTION = "Nothing flagged from the current rules.";
const LIVE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatNullableMetric(
  value: number | null | undefined,
  suffix = ""
): { available: boolean; display: string } {
  if (value == null || !Number.isFinite(value)) {
    return { available: false, display: UNAVAILABLE };
  }
  return { available: true, display: suffix ? `${value}${suffix}` : String(value) };
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const ymd = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}

function sourceLabel(source: CoachAttentionFlag["source"]): string {
  if (source === "programme_session") return "Session log";
  if (source === "weekly_check_in") return "Weekly check-in";
  if (source === "daily_readiness") return "Daily readiness";
  return "Benchmark";
}

function severityClass(severity: CoachAttentionFlag["severity"]): string {
  if (severity === "critical") return "text-red-300";
  if (severity === "warn") return "text-amber-200";
  return "text-zinc-300";
}

function FactRow({
  label,
  value,
  hint,
  available = true,
}: {
  label: string;
  value: string;
  hint?: string | null;
  available?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-x-4 border-b border-zinc-800/80 py-1.5 text-sm sm:grid-cols-[10.5rem_minmax(0,1fr)]">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd>
        <span className={available ? "text-zinc-100" : "text-zinc-500"}>{value}</span>
        {hint ? <span className="ml-2 text-xs text-zinc-500">{hint}</span> : null}
      </dd>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-400/80">
            {eyebrow}
          </p>
          <h3 className="m-0 text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TextAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-xs font-semibold text-yellow-300 underline-offset-2 hover:underline"
    >
      {children}
    </button>
  );
}

export function CommandCentreOverview({
  athleteId,
  onTabChange,
}: {
  athleteId: string;
  onTabChange: (tab: AthleteTab) => void;
}) {
  const live = LIVE_ID_RE.test(athleteId);
  const [data, setData] = useState<HyroxCommandCentrePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(live);

  const reload = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${encodeURIComponent(athleteId)}/command-centre`, {
        credentials: "include",
      });
      const json = (await res.json()) as {
        success?: boolean;
        commandCentre?: HyroxCommandCentrePayload;
        error?: string;
      };
      if (!res.ok || !json.success || !json.commandCentre) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setData(json.commandCentre);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Could not load command centre.");
    } finally {
      setLoading(false);
    }
  }, [athleteId, live]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!live) {
    return <p className="text-sm text-zinc-500">{NO_LIVE_ATHLETE}</p>;
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading command centre…</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-200">{error}</p>
        <TextAction onClick={() => void reload()}>Retry</TextAction>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">{NO_LIVE_ATHLETE}</p>;
  }

  const week = data.thisWeek;
  const sessions =
    week.plannedSessions != null && week.completedSessions != null
      ? `${week.completedSessions}/${week.plannedSessions}`
      : UNAVAILABLE;
  const run = formatNullableMetric(week.runDistanceKm, " km");
  const duration = formatNullableMetric(week.trainingDurationMinutes, " min");
  const rpe = formatNullableMetric(week.averageRpe);
  const pending = week.pendingBenchmarkUnavailable
    ? { available: false, display: UNAVAILABLE }
    : week.pendingBenchmarkCount == null
      ? { available: false, display: UNAVAILABLE }
      : { available: true, display: String(week.pendingBenchmarkCount) };

  const checkIn = week.latestCheckIn;
  const analytics = data.analytics;
  const prev = analytics?.previousWeek;
  const rolling = analytics?.rolling4;
  const engineReady = data.analyticsStatus === "ok" && analytics != null;
  const previousDisplay =
    prev != null
      ? `${prev.completedSessions}/${prev.plannedSessions} sessions`
      : data.recentProgress.previousWeekPlanned != null && data.recentProgress.previousWeekCompleted != null
        ? `${data.recentProgress.previousWeekCompleted}/${data.recentProgress.previousWeekPlanned} sessions`
        : "No previous published week";
  const previousRpe = prev?.averageRpe ?? data.recentProgress.previousWeekAverageRpe;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-400/80">
          Command centre
        </p>
        <p className="m-0 text-[11px] text-zinc-600">
          {engineReady ? "Analytics from Workstream B" : "Session logs / check-ins / anchors only"}
          {week.weekNumber != null ? ` · Week ${week.weekNumber}` : ""}
          {week.startDate && week.endDate
            ? ` · ${formatShortDate(week.startDate)}–${formatShortDate(week.endDate)}`
            : ""}
        </p>
      </div>

      <Section eyebrow="This week" title="Published week only">
        {!week.published ? <p className="mb-2 text-sm text-amber-200">{UNPUBLISHED_WEEK}</p> : null}
        <dl>
          <FactRow
            label="Sessions"
            value={week.published ? sessions : UNAVAILABLE}
            hint={week.published && week.completionPct != null ? `${week.completionPct}% complete` : null}
            available={week.published && week.plannedSessions != null}
          />
          <FactRow
            label="Key sessions"
            value={
              week.keySessionsCompleted != null && week.keySessionsPlanned != null
                ? `${week.keySessionsCompleted}/${week.keySessionsPlanned}`
                : UNAVAILABLE
            }
            available={week.keySessionsCompleted != null}
          />
          <FactRow label="Run distance" value={run.display} available={run.available} />
          <FactRow label="Training time" value={duration.display} available={duration.available} />
          <FactRow label="Average RPE" value={rpe.display} available={rpe.available} />
          <FactRow
            label="Session-RPE load"
            value={formatNullableMetric(week.sessionRpeLoad).display}
            available={week.sessionRpeLoad != null}
          />
          <FactRow
            label="Check-in"
            value={
              checkIn
                ? `Week ${checkIn.weekNumber} · energy ${checkIn.energy ?? "—"} · soreness ${checkIn.soreness ?? "—"}`
                : "No submitted check-in"
            }
            hint={checkIn ? formatShortDate(checkIn.submittedAt) : null}
            available={Boolean(checkIn)}
          />
          <FactRow label="Pending benchmarks" value={pending.display} available={pending.available} />
          <FactRow
            label="Upcoming key"
            value={
              week.upcomingKeySession
                ? `${week.upcomingKeySession.name} · ${week.upcomingKeySession.dayOfWeek}${
                    week.upcomingKeySession.dateYmd
                      ? ` · ${formatShortDate(week.upcomingKeySession.dateYmd)}`
                      : ""
                  }`
                : "None remaining this week"
            }
            available={Boolean(week.upcomingKeySession)}
          />
        </dl>
      </Section>

      <Section eyebrow="Needs attention" title="Transparent flags">
        {data.needsAttention.length === 0 ? (
          <p className="text-sm text-zinc-500">{NO_ATTENTION}</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {data.needsAttention.map((flag) => (
              <li key={flag.id} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={`m-0 text-sm font-semibold ${severityClass(flag.severity)}`}>{flag.title}</p>
                  <TextAction onClick={() => onTabChange(flag.actionTab)}>
                    {flag.actionLabel}
                  </TextAction>
                </div>
                <p className="mt-0.5 text-sm text-zinc-300">{flag.reason}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {sourceLabel(flag.source)}
                  {flag.date ? ` · ${formatShortDate(flag.date)}` : ""}
                  {flag.sessionName ? ` · ${flag.sessionName}` : ""}
                  {` · ${flag.code}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        eyebrow="Performance profile"
        title="Active anchors"
        action={
          <TextAction onClick={() => onTabChange("Performance Profile")}>Open Performance Profile</TextAction>
        }
      >
        {data.performanceProfile.unavailable ? (
          <p className="text-sm text-zinc-500">
            Performance Profile table is unavailable. Pending count and anchors cannot be loaded.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-zinc-500">
              Pending review: {data.performanceProfile.pendingCount ?? 0}. Management stays on the
              Performance Profile tab.
            </p>
            <dl>
              {data.performanceProfile.anchors.map((anchor) => (
                <FactRow
                  key={anchor.key}
                  label={anchor.label}
                  value={anchor.display ?? "No active anchor"}
                  hint={anchor.derived}
                  available={Boolean(anchor.display)}
                />
              ))}
            </dl>
          </>
        )}
      </Section>

      <Section eyebrow="Recent progress" title="Slots for training analytics">
        {!engineReady ? <p className="mb-2 text-sm text-zinc-500">{EMPTY_PROGRESS}</p> : null}
        <dl>
          <FactRow
            label="Previous week"
            value={previousDisplay}
            hint={
              previousRpe != null
                ? `avg RPE ${previousRpe}`
                : previousDisplay.startsWith("No previous")
                  ? null
                  : "avg RPE unavailable"
            }
            available={!previousDisplay.startsWith("No previous")}
          />
          <FactRow
            label="Rolling 4 distance"
            value={formatNullableMetric(rolling?.runDistanceKm, " km").display}
            available={rolling?.runDistanceKm != null}
          />
          <FactRow
            label="Rolling 4 time"
            value={formatNullableMetric(rolling?.trainingDurationMinutes, " min").display}
            available={rolling?.trainingDurationMinutes != null}
          />
          <FactRow
            label="Rolling 4 completion"
            value={formatNullableMetric(rolling?.completionPct, "%").display}
            available={rolling?.completionPct != null}
          />
          <FactRow
            label="Rolling 4 RPE"
            value={formatNullableMetric(rolling?.averageRpe).display}
            available={rolling?.averageRpe != null}
          />
        </dl>
        {analytics?.distribution.length ? (
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {analytics.distribution.map((slice) => (
              <li key={slice.modality}>
                {slice.modality}: {slice.sessionCount} sessions
                {slice.durationMinutes != null ? ` · ${slice.durationMinutes} min` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        {analytics?.benchmarks.length ? (
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {analytics.benchmarks.map((series) => (
              <li key={series.type}>
                {series.label}: {series.points.length} measured point(s)
              </li>
            ))}
          </ul>
        ) : null}
        {analytics?.unsupported.length ? (
          <p className="mt-2 text-[11px] text-zinc-600">Unsupported: {analytics.unsupported.join(", ")}</p>
        ) : null}
      </Section>

      <Section eyebrow="Quick actions" title="Coach only">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <TextAction onClick={() => onTabChange("Programme Builder")}>Edit programme</TextAction>
          <Link
            href={`/admin/hyrox-athletes/${athleteId}/preview/start`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-yellow-300 underline-offset-2 hover:underline"
          >
            View as athlete
          </Link>
          <TextAction onClick={() => onTabChange("Testing")}>Review testing</TextAction>
          <TextAction onClick={() => onTabChange("Performance Profile")}>Review pending benchmark</TextAction>
          <TextAction onClick={() => onTabChange("Check-Ins")}>Open weekly check-in</TextAction>
          <TextAction onClick={() => onTabChange("Coach Notes")}>Athlete-facing note</TextAction>
          <TextAction onClick={() => onTabChange("Coach Notes")}>Internal coach note</TextAction>
        </div>
        {data.notes.athleteFacingNote || data.notes.internalCoachNote ? (
          <dl className="mt-3">
            <FactRow
              label="Athlete-facing note"
              value={data.notes.athleteFacingNote ?? "None"}
              available={Boolean(data.notes.athleteFacingNote)}
            />
            <FactRow
              label="Internal note"
              value={data.notes.internalCoachNote ?? "None"}
              hint={
                data.notes.internalCoachNote
                  ? "Internal — never shown to the athlete"
                  : null
              }
              available={Boolean(data.notes.internalCoachNote)}
            />
          </dl>
        ) : null}
      </Section>
    </div>
  );
}

