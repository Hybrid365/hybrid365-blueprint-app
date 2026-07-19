"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import {
  performanceTestTypeLabel,
  requiredPerformanceTestTypesForVersion,
  type PerformanceTestResultRow,
  type PerformanceTestType,
  type RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type CoachPerformancePayload = {
  success?: boolean;
  error?: string;
  programmeWeekId: string | null;
  performanceTestingVersion?: number;
  isLegacyProtocol?: boolean;
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
  completion?: { submitted: number; total: number; reviewed: number };
};

function Metric({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-200">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

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

  const version = (data?.performanceTestingVersion ??
    data?.profile?.performanceTestingVersion ??
    2) as 1 | 2;
  const requiredTypes = requiredPerformanceTestTypesForVersion(version);
  const submitted =
    data?.results.filter((r) => r.status === "submitted" || r.status === "reviewed") ?? [];
  const missing = requiredTypes.filter((t) => !submitted.some((r) => r.test_type === t));
  const profile = data?.profile;
  const simulation = profile?.compromised.simulation;
  const sundayResult =
    submitted.find((r) => r.test_type === "compromised_hyrox_benchmark") ??
    submitted.find((r) => r.test_type === "compromised_sled_run");

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
          <div className="space-y-2 text-sm">
            <p className="text-emerald-300/90">
              Published testing week linked · {data.sessions.length} programme sessions ·{" "}
              {data.completion?.submitted ?? submitted.length}/
              {data.completion?.total ?? requiredTypes.length} results submitted · Protocol v
              {version}
            </p>
            {data.isLegacyProtocol ? (
              <p className="text-xs text-amber-200/90">
                Legacy Version 1 protocol — original schedule and result structure preserved.
              </p>
            ) : null}
            <Link
              href={`/admin/hyrox-athletes/${athleteId}/performance-testing-preview`}
              className="inline-flex text-xs font-semibold text-cyan-300 underline"
            >
              Open athlete preview
            </Link>
          </div>
        )}
      </DashCard>

      {simulation ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashCard>
            <SectionHeading title="Sunday simulation — raw splits" />
            <dl className="mt-2 grid grid-cols-2 gap-3">
              <Metric label="Protocol" value={simulation.protocolVersion} />
              <Metric label="Total time" value={simulation.totalCompletionTime} />
              <Metric label="Overall limitation" value={simulation.biggestReportedLimiter} />
            </dl>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Run splits</p>
              <ul className="mt-1 space-y-1 text-xs text-zinc-300">
                {simulation.runSplits.length ? (
                  simulation.runSplits.map((line) => <li key={line}>{line}</li>)
                ) : (
                  <li className="text-zinc-500">Missing run splits</li>
                )}
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Station splits</p>
              <ul className="mt-1 space-y-1 text-xs text-zinc-300">
                {simulation.stationSplits.map((s) => (
                  <li key={s.label}>
                    {s.label}: {s.time ?? "—"}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Equipment / setup</p>
              <dl className="mt-1 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                {Object.entries(simulation.equipmentSetup).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-zinc-500">{key}</dt>
                    <dd>{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </DashCard>

          <DashCard>
            <SectionHeading title="Sunday simulation — derived insights" />
            <p className="text-xs text-zinc-500">
              Shown only when required inputs exist — no false precision.
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Metric label="Avg compromised run pace" value={simulation.averageCompromisedRunPace} />
              <Metric label="Fastest run" value={simulation.fastestRun} />
              <Metric label="Slowest run" value={simulation.slowestRun} />
              <Metric label="Run 1 vs Run 8" value={simulation.run1VersusRun8} />
              <Metric label="Avg first-four pace" value={simulation.averageFirstFourRunPace} />
              <Metric label="Avg last-four pace" value={simulation.averageLastFourRunPace} />
              <Metric
                label="Running deterioration"
                value={simulation.percentageRunningDeterioration}
              />
              <Metric
                label="Largest slowdown after"
                value={simulation.largestSlowdownAfterStation}
              />
              <Metric
                label="Fresh vs sim SkiErg"
                value={simulation.freshSkiVersusSimulationSki}
              />
              <Metric
                label="Fresh vs sim RowErg"
                value={simulation.freshRowVersusSimulationRow}
              />
            </dl>
          </DashCard>
        </div>
      ) : null}

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
                        : r.status === "submitted"
                          ? "Submitted"
                          : r.status}
                    </span>
                  </div>
                  {r.test_type === "compromised_hyrox_benchmark" ? (
                    <p className="mt-2 text-xs text-zinc-400">
                      Protocol: {String(r.result_json.protocolVersion ?? "—")} · Total:{" "}
                      {String(r.result_json.totalCompletionTime ?? "—")} · RPE:{" "}
                      {String(r.result_json.overallRpe ?? "—")}
                    </p>
                  ) : (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-950/80 p-2 text-[10px] text-zinc-400">
                      {JSON.stringify(r.result_json, null, 2)}
                    </pre>
                  )}
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
                  {!r.video_url && !r.proof_url && r.test_type === sundayResult?.test_type ? (
                    <p className="mt-2 text-[11px] text-zinc-500">No proof/video attached</p>
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
              <p className="text-sm text-emerald-300/90">All required tests submitted.</p>
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
