"use client";

import { useCallback, useEffect, useState } from "react";
import type { HyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import {
  ALL_PERFORMANCE_TEST_TYPES,
  performanceTestTypeLabel,
  statusLabel,
  type PerformanceTestResultRow,
  type PerformanceTestType,
  type RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type CoachPerformancePayload = {
  success?: boolean;
  error?: string;
  programmeWeekId: string | null;
  sessions: Array<{
    id: string;
    dayOfWeek: string;
    sessionSlot: string;
    sessionName: string;
    testType: string;
  }>;
  results: PerformanceTestResultRow[];
  baseline: RecoveryBaselineRow | null;
  profile: HyroxPerformanceProfile;
};

export function PerformanceTestingCoachPanel({ athleteId }: { athleteId: string }) {
  const [data, setData] = useState<CoachPerformancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [coachNotesDraft, setCoachNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/performance-testing`, {
        credentials: "include",
      });
      const json = (await res.json()) as CoachPerformancePayload;
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not load performance testing.");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewResult = async (resultId: string, coachReviewed: boolean, reopen = false) => {
    setReviewingId(resultId);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/performance-testing`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          coachReviewed,
          coachNotes: coachNotesDraft[resultId] ?? null,
          reopen,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Review update failed.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review update failed.");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading performance testing…</p>;
  }

  if (error && !data) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  const submitted = data?.results.filter((r) => r.status === "submitted" || r.status === "reviewed") ?? [];
  const missing = ALL_PERFORMANCE_TEST_TYPES.filter(
    (t) => !submitted.some((r) => r.test_type === t)
  );
  const profile = data?.profile;

  return (
    <div className="space-y-4">
      <DashCard>
        <SectionHeading title="Hybrid365 Performance Testing" />
        {!data?.programmeWeekId ? (
          <p className="text-sm text-zinc-500">
            No published performance testing week detected. Add the testing week in Programme Builder
            and publish through the normal workflow.
          </p>
        ) : (
          <p className="text-sm text-emerald-300/90">
            Published testing week linked · {data.sessions.length} programme sessions ·{" "}
            {submitted.length}/{ALL_PERFORMANCE_TEST_TYPES.length} results submitted
          </p>
        )}
      </DashCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashCard>
          <SectionHeading title="Submitted tests" />
          {submitted.length === 0 ? (
            <p className="text-sm text-zinc-500">No submitted results yet.</p>
          ) : (
            <ul className="space-y-3">
              {submitted.map((r) => (
                <li key={r.id} className="rounded-xl border border-zinc-800 p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold text-white">
                      {performanceTestTypeLabel(r.test_type as PerformanceTestType)}
                    </p>
                    <span className="text-xs text-zinc-500">
                      {r.coach_reviewed || r.status === "reviewed"
                        ? "Reviewed"
                        : statusLabel(r.status)}
                    </span>
                  </div>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-950/80 p-2 text-[10px] text-zinc-400">
                    {JSON.stringify(r.result_json, null, 2)}
                  </pre>
                  {r.video_url ? (
                    <a
                      href={r.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-xs text-cyan-300 underline"
                    >
                      Video link
                    </a>
                  ) : null}
                  {r.proof_url ? (
                    <a
                      href={r.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-xs text-cyan-300 underline"
                    >
                      Proof link
                    </a>
                  ) : null}
                  <textarea
                    value={coachNotesDraft[r.id] ?? r.coach_notes ?? ""}
                    onChange={(e) =>
                      setCoachNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Coach notes"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!r.coach_reviewed && r.status !== "reviewed" ? (
                      <button
                        type="button"
                        disabled={reviewingId === r.id}
                        onClick={() => void reviewResult(r.id, true)}
                        className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black disabled:opacity-50"
                      >
                        Mark reviewed
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={reviewingId === r.id}
                        onClick={() => void reviewResult(r.id, false, true)}
                        className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-300 disabled:opacity-50"
                      >
                        Reopen for athlete edit
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashCard>

        <div className="space-y-4">
          <DashCard>
            <SectionHeading title="Missing tests" />
            {missing.length === 0 ? (
              <p className="text-sm text-emerald-300/90">All tests submitted.</p>
            ) : (
              <ul className="list-inside list-disc text-sm text-zinc-400">
                {missing.map((t) => (
                  <li key={t}>{performanceTestTypeLabel(t)}</li>
                ))}
              </ul>
            )}
          </DashCard>

          <DashCard>
            <SectionHeading title="Recovery baseline" />
            {data?.baseline ? (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Resting HR</dt>
                  <dd className="font-semibold text-white">{data.baseline.resting_hr_baseline} bpm</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Baseline days</dt>
                  <dd className="font-semibold text-white">{data.baseline.baseline_days}</dd>
                </div>
                {data.baseline.average_hrv != null ? (
                  <div>
                    <dt className="text-zinc-500">HRV</dt>
                    <dd className="text-zinc-200">{data.baseline.average_hrv}</dd>
                  </div>
                ) : null}
                {data.baseline.device_source ? (
                  <div className="col-span-2">
                    <dt className="text-zinc-500">Device</dt>
                    <dd className="text-zinc-200">{data.baseline.device_source}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">No recovery baseline recorded yet.</p>
            )}
          </DashCard>

          {profile ? (
            <DashCard>
              <SectionHeading title="Derived performance profile" />
              <p className="text-xs text-zinc-500">
                Read-only coach summary — does not change the athlete programme.
              </p>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Primary limiter:</span>{" "}
                  {profile.likelyPrimaryLimiter ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Secondary limiter:</span>{" "}
                  {profile.likelySecondaryLimiter ?? "—"}
                </p>
                {profile.suggestedProgrammingEmphasis.length > 0 ? (
                  <ul className="list-inside list-disc text-xs text-zinc-400">
                    {profile.suggestedProgrammingEmphasis.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DashCard>
          ) : null}
        </div>
      </div>

      <DashCard>
        <SectionHeading title="Onboarding benchmarks (unchanged)" />
        <p className="text-sm text-zinc-500">
          Legacy onboarding tests at /athlete/testing and hyrox_testing_results remain separate from
          this structured performance testing week.
        </p>
      </DashCard>
    </div>
  );
}
