"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import {
  performanceTestingApiBase,
  type PerformanceTestingViewMode,
} from "@/app/lib/hyroxPerformanceTestingApiConfig";
import type { AthletePerformanceTestingPayload } from "@/app/lib/hyroxPerformanceTestingServer";
import {
  PERFORMANCE_TEST_INTRO,
  PERFORMANCE_TEST_WEEK_DAYS,
  PERFORMANCE_TEST_WEEK_LABEL,
  WHY_WE_TEST_CARDS,
  performanceTestTypeLabel,
  statusLabel,
  type PerformanceTestResultRow,
  type PerformanceTestType,
  type RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import {
  PerformanceTestResultForm,
  RecoveryBaselineForm,
} from "@/components/athlete-command-centre/PerformanceTestingForms";

export type PerformanceTestingPageViewProps = {
  mode?: PerformanceTestingViewMode;
  athleteId?: string;
  athleteName?: string;
  athleteStatus?: string;
  readOnly?: boolean;
  backToAdminHref?: string;
};

export function PerformanceTestingPageView({
  mode = "athlete",
  athleteId,
  athleteName,
  athleteStatus,
  readOnly = false,
  backToAdminHref,
}: PerformanceTestingPageViewProps = {}) {
  const [data, setData] = useState<AthletePerformanceTestingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isCoachPreview = mode === "coach_preview";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = performanceTestingApiBase(mode, athleteId);
      const res = await fetch(apiBase, {
        credentials: "include",
      });
      const json = (await res.json()) as AthletePerformanceTestingPayload & {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || json.success === false) {
        throw new Error(json.error ?? "Could not load performance testing.");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [athleteId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const resultsByType = useMemo(() => {
    const map = new Map<string, PerformanceTestResultRow>();
    for (const row of data?.results ?? []) {
      map.set(row.test_type, row);
    }
    return map;
  }, [data?.results]);

  const handleResultSaved = useCallback(
    (result: PerformanceTestResultRow) => {
      setData((prev) => {
        if (!prev) return prev;
        const results = [...prev.results.filter((r) => r.test_type !== result.test_type), result];
        return {
          ...prev,
          results,
          completion: {
            ...prev.completion,
            submitted: results.filter((r) => r.status === "submitted" || r.status === "reviewed")
              .length,
            reviewed: results.filter((r) => r.coach_reviewed || r.status === "reviewed").length,
          },
        };
      });
      void load();
    },
    [load]
  );

  const handleBaselineSaved = useCallback((baseline: RecoveryBaselineRow) => {
    setData((prev) => (prev ? { ...prev, baseline } : prev));
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading performance testing…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  const hasPublishedWeek = Boolean(data?.programmeWeekId);
  const profile = data?.profile as HyroxPerformanceProfile | undefined;
  const adminDashboardHref =
    backToAdminHref ?? (athleteId ? `/admin/hyrox-athletes/${athleteId}?tab=Testing` : undefined);
  const programmeBuilderHref =
    athleteId ? `/admin/hyrox-athletes/${athleteId}?tab=Programme%20Builder` : undefined;

  return (
    <div className="space-y-5">
      {isCoachPreview ? (
        <div className="rounded-2xl border border-cyan-500/35 bg-cyan-400/10 px-4 py-4 sm:px-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">Coach Preview</p>
          <p className="mt-2 text-sm text-zinc-200">
            You are viewing the Performance Testing page as it appears for this athlete. Actions made
            here are performed through your coaching account.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
            {athleteName ? (
              <span>
                Athlete: <span className="text-white">{athleteName}</span>
              </span>
            ) : null}
            {athleteStatus ? (
              <span>
                Status: <span className="text-white">{athleteStatus.replace(/_/g, " ")}</span>
              </span>
            ) : null}
            <span>
              Testing week:{" "}
              <span className="text-white">
                {hasPublishedWeek ? "Published" : "Not published"}
              </span>
            </span>
          </div>
          {readOnly ? (
            <p className="mt-2 text-xs text-zinc-500">
              Preview only — saving is disabled. Enable editing below to test live saves.
            </p>
          ) : null}
          {adminDashboardHref ? (
            <div className="mt-4">
              <Link
                href={adminDashboardHref}
                className="inline-flex rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-cyan-500/40 hover:text-cyan-100"
              >
                Back to athlete dashboard
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <HyroxSection>
        <HyroxEyebrow>{PERFORMANCE_TEST_WEEK_LABEL}</HyroxEyebrow>
        <div className="mt-4">
          <HyroxH1>Hybrid365 Performance Testing</HyroxH1>
        </div>
        <div className="mt-4">
          <HyroxLead>{PERFORMANCE_TEST_INTRO}</HyroxLead>
        </div>
        {!hasPublishedWeek ? (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 text-sm text-zinc-400">
            {isCoachPreview ? (
              <>
                <p>No Performance Testing Week is currently published for this athlete.</p>
                {programmeBuilderHref ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={adminDashboardHref ?? "#"}
                      className="rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-300"
                    >
                      Back to athlete dashboard
                    </Link>
                    <Link
                      href={programmeBuilderHref}
                      className="rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"
                    >
                      Add Performance Testing Week
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <p>
                Your coach has not published a performance testing week to your programme yet. Once
                published, your full testing schedule and result forms will appear here.
              </p>
            )}
          </div>
        ) : null}
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="text-lg font-bold text-white">Why we test</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {WHY_WE_TEST_CARDS.map((card) => (
            <HyroxCard key={card.title} className="p-4">
              <p className="font-semibold text-yellow-300/90">{card.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{card.body}</p>
            </HyroxCard>
          ))}
        </div>
      </HyroxSection>

      <HyroxSection>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Testing week overview</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {data?.completion.submitted ?? 0} of {data?.completion.total ?? 12} tests submitted
              · {data?.completion.reviewed ?? 0} coach reviewed
            </p>
          </div>
        </div>
        <ol className="mt-4 space-y-2">
          {PERFORMANCE_TEST_WEEK_DAYS.map((day) => (
            <li
              key={`${day.day}-${day.title}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-white">
                {day.day} — {day.title}
              </span>
              <span className="text-xs text-zinc-500">
                {day.testTypes
                  .map((t) => {
                    const row = resultsByType.get(t);
                    return row ? statusLabel(row.status) : "Outstanding";
                  })
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ol>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="text-lg font-bold text-white">Recovery baseline</h2>
        <div className="mt-4">
          <RecoveryBaselineForm
            baseline={data?.baseline ?? null}
            testWeekId={data?.testWeekId ?? "test-week-1"}
            onSaved={handleBaselineSaved}
            mode={mode}
            athleteId={athleteId}
            readOnly={readOnly}
            showCoachSaveNote={isCoachPreview}
          />
        </div>
      </HyroxSection>

      <HyroxSection>
        <h2 className="text-lg font-bold text-white">Daily tests</h2>
        <div className="mt-4 space-y-6">
          {PERFORMANCE_TEST_WEEK_DAYS.map((day) => (
            <div key={`${day.day}-${day.title}`}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-400/80">
                {day.day} — {day.title}
              </h3>
              <div className="mt-3 space-y-3">
                {day.testTypes.map((testType) => (
                  <PerformanceTestResultForm
                    key={testType}
                    testType={testType as PerformanceTestType}
                    existing={resultsByType.get(testType) ?? null}
                    programmeWeekId={data?.programmeWeekId ?? null}
                    testWeekId={data?.testWeekId ?? "test-week-1"}
                    locked={Boolean(resultsByType.get(testType)?.coach_reviewed)}
                    readOnly={readOnly}
                    mode={mode}
                    athleteId={athleteId}
                    showCoachSaveNote={isCoachPreview}
                    onSaved={handleResultSaved}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </HyroxSection>

      <HyroxSection clean>
        <h2 className="text-lg font-bold text-white">Technique and video guidance</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Where your coach has requested video, add a URL when you submit results. This supports
          technique review for running mechanics, strength form, sled work and station movement.
        </p>
      </HyroxSection>

      {profile && profile.completedTests.length > 0 ? (
        <HyroxSection>
          <h2 className="text-lg font-bold text-white">Your performance profile</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Coach-reviewable summary from your submitted results. Your programme is not changed
            automatically.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProfileTile label="5 km time" value={profile.running.fiveKTime} />
            <ProfileTile label="5 km pace" value={profile.running.fiveKPace} />
            <ProfileTile label="Ski 2 km" value={profile.ski.ski2kTime} />
            <ProfileTile label="Row 2 km" value={profile.row.row2kTime} />
            <ProfileTile label="Dead hang" value={profile.grip.deadHangSeconds} suffix="s" />
            <ProfileTile label="Primary limiter" value={profile.likelyPrimaryLimiter} />
            <ProfileTile label="Secondary limiter" value={profile.likelySecondaryLimiter} />
          </div>
          {profile.suggestedProgrammingEmphasis.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Suggested programming emphasis
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                {profile.suggestedProgrammingEmphasis.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {profile.missingInformationWarnings.length > 0 ? (
            <div className="mt-4 rounded-xl border border-zinc-700 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Outstanding information</p>
              <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
                {profile.missingInformationWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </HyroxSection>
      ) : null}

      <HyroxSection clean>
        <h2 className="text-lg font-bold text-white">Coach review</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Once your coach has reviewed submitted tests, results will show as coach reviewed here and
          in your programme notes. Contact your coach if you need to update a reviewed result.
        </p>
        <ul className="mt-4 space-y-2">
          {(data?.results ?? [])
            .filter((r) => r.status !== "not_started")
            .map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm"
              >
                <span className="text-zinc-200">
                  {performanceTestTypeLabel(r.test_type as PerformanceTestType)}
                </span>
                <span className="text-xs text-zinc-500">
                  {r.coach_reviewed ? "Coach reviewed" : statusLabel(r.status)}
                </span>
              </li>
            ))}
        </ul>
      </HyroxSection>
    </div>
  );
}

function ProfileTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-[10px] font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">
        {value ? `${value}${suffix ?? ""}` : "—"}
      </p>
    </div>
  );
}
