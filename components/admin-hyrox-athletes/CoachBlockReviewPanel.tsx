"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BLOCK_REVIEW_RECOMMENDATION_OPTIONS,
  emptyCoachNotes,
  maxReviewBlocks,
  type BlockReviewCompletionSummary,
  type HyroxBlockReviewCoachNotes,
  type HyroxBlockReviewNextRecommendation,
  type HyroxBlockReviewRecord,
} from "@/app/lib/hyroxBlockReview";
import { DashCard, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";

const COACH_NOTE_FIELDS: { key: keyof HyroxBlockReviewCoachNotes; label: string; rows: number }[] = [
  { key: "whatWentWell", label: "What went well?", rows: 3 },
  { key: "whatNeedsAdjusting", label: "What needs adjusting?", rows: 3 },
  { key: "currentPriorityFocus", label: "Current priority focus", rows: 2 },
  { key: "stationWeaknessFocus", label: "Station weakness focus", rows: 2 },
  { key: "runningProgressionNotes", label: "Running progression notes", rows: 2 },
  { key: "strengthLegEnduranceNotes", label: "Strength / leg endurance notes", rows: 2 },
  { key: "recoveryInjuryConsiderations", label: "Recovery / injury considerations", rows: 2 },
  { key: "nextBlockGoal", label: "Next block goal", rows: 2 },
];

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600";
}

export function CoachBlockReviewPanel({
  athleteId,
  programmeLengthWeeks = 12,
  currentProgrammeBlock = 1,
}: {
  athleteId: string;
  programmeLengthWeeks?: number;
  currentProgrammeBlock?: number;
}) {
  const maxBlocks = maxReviewBlocks(programmeLengthWeeks === 16 ? 16 : 12);
  const [blockNumber, setBlockNumber] = useState(
    Math.min(Math.max(1, currentProgrammeBlock), maxBlocks)
  );
  const [summary, setSummary] = useState<BlockReviewCompletionSummary | null>(null);
  const [coachNotes, setCoachNotes] = useState<HyroxBlockReviewCoachNotes>(emptyCoachNotes());
  const [recommendation, setRecommendation] = useState<HyroxBlockReviewNextRecommendation | "">("");
  const [nextBlockFocus, setNextBlockFocus] = useState("");
  const [savedReview, setSavedReview] = useState<HyroxBlockReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/hyrox/athletes/${athleteId}/block-review?block=${blockNumber}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not load block review.");
        setSummary(null);
        return;
      }
      setSummary(data.summary);
      const review = data.review as HyroxBlockReviewRecord | null;
      setSavedReview(review);
      if (review) {
        setCoachNotes(review.coachNotes);
        setRecommendation(review.nextBlockRecommendation ?? "");
        setNextBlockFocus(review.nextBlockFocus ?? "");
      } else {
        setCoachNotes(emptyCoachNotes());
        setRecommendation("");
        setNextBlockFocus("");
      }
    } catch {
      setError("Network error loading block review.");
    } finally {
      setLoading(false);
    }
  }, [athleteId, blockNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/block-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_number: blockNumber,
          coach_notes: coachNotes,
          next_block_recommendation: recommendation || null,
          next_block_focus: nextBlockFocus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data.error ?? "Save failed.");
        return;
      }
      setSavedReview(data.review);
      setSummary(data.summary);
      setToast(data.message ?? "Block review saved.");
    } catch {
      setToast("Network error saving block review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashCard>
        <SectionHeading title="Block review" />
        <p className="mt-1 text-xs text-zinc-500">
          Review the previous 4-week block before generating the next. Reviews are saved per block
          (after weeks 4, 8, and 12).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-xs text-zinc-500">
            Block
            <select
              value={blockNumber}
              onChange={(e) => setBlockNumber(Number(e.target.value))}
              className={`${inputClass()} max-w-[12rem]`}
            >
              {Array.from({ length: maxBlocks }, (_, i) => i + 1).map((b) => (
                <option key={b} value={b}>
                  Block {b} (W{(b - 1) * 4 + 1}–{b * 4})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-400"
          >
            Refresh data
          </button>
          {savedReview ? (
            <span className="text-[11px] text-emerald-400/90">
              Saved {new Date(savedReview.updatedAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">No saved review for this block yet</span>
          )}
        </div>
      </DashCard>

      {error ? (
        <p className="rounded-lg border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading block summary…</p>
      ) : summary ? (
        <>
          <DashCard>
            <SectionHeading title={`Block ${summary.blockNumber} · ${summary.blockTitle}`} />
            <p className="mt-1 text-xs text-zinc-500">
              Weeks {summary.weeksStart}–{summary.weeksEnd}: {summary.weekLabels.join(" · ")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Sessions completed"
                value={`${summary.sessionsCompleted} / ${summary.sessionsTotal}`}
              />
              <StatTile
                label="Key sessions"
                value={`${summary.keySessionsCompleted} / ${summary.keySessionsTotal}`}
              />
              <StatTile
                label="Avg logged RPE"
                value={
                  summary.averageRpe != null
                    ? `${summary.averageRpe} (n=${summary.rpeSampleCount})`
                    : "—"
                }
              />
              <StatTile label="Missed sessions" value={String(summary.missedSessions)} />
              <StatTile label="Sessions with notes" value={String(summary.sessionsWithNotes)} />
              <StatTile label="High RPE (≥8)" value={String(summary.highRpeSessionCount)} />
              <StatTile
                label="Check-ins submitted"
                value={`${summary.checkIn.submittedCount} / ${summary.checkIn.count}`}
              />
              <StatTile
                label="Testing results"
                value={String(summary.testing.length)}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase text-zinc-600">Week breakdown</p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {summary.weekBreakdown.map((w) => (
                    <li key={w.weekNumber}>
                      W{w.weekNumber}: {w.completed}/{w.total} sessions
                      {w.published ? "" : " · not published"}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-zinc-600">Athlete context</p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  <li>Main limiter: {summary.athleteContext.mainLimiter ?? "—"}</li>
                  <li>Secondary: {summary.athleteContext.secondaryLimiter ?? "—"}</li>
                  <li>Block focus: {summary.athleteContext.firstBlockFocus ?? "—"}</li>
                  <li>Recovery risk: {summary.athleteContext.recoveryRisk ?? "—"}</li>
                  {summary.athleteContext.stationWeaknesses.length ? (
                    <li>Stations: {summary.athleteContext.stationWeaknesses.join(", ")}</li>
                  ) : null}
                </ul>
              </div>
            </div>

            {summary.skippedKeyMissed.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase text-amber-300/90">
                  Skipped / key missed
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-100/80">
                  {summary.skippedKeyMissed.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary.highRpeSessions.length > 0 ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-600">High RPE sessions</p>
                <ul className="mt-1 text-xs text-zinc-400">
                  {summary.highRpeSessions.map((s) => (
                    <li key={`${s.weekNumber}-${s.sessionName}`}>
                      W{s.weekNumber} {s.dayOfWeek} · {s.sessionName} (RPE {s.rpe})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary.checkIn.submittedCount > 0 ? (
              <div className="mt-3 text-xs text-zinc-500">
                Check-in averages — sleep {summary.checkIn.avgSleep ?? "—"}, energy{" "}
                {summary.checkIn.avgEnergy ?? "—"}, soreness {summary.checkIn.avgSoreness ?? "—"}
                {summary.checkIn.avgBodyweight != null
                  ? ` · BW ~${summary.checkIn.avgBodyweight} kg`
                  : ""}
              </div>
            ) : null}

            {summary.testing.length > 0 ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-zinc-600">Testing / benchmarks</p>
                <ul className="mt-1 space-y-1 text-xs text-zinc-400">
                  {summary.testing.map((t) => (
                    <li key={`${t.testType}-${t.createdAt}`}>
                      {t.testType.replace(/_/g, " ")}: {t.resultSummary}
                      {t.testDate ? ` (${t.testDate})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </DashCard>

          <DashCard>
            <SectionHeading title="Coach review notes" />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {COACH_NOTE_FIELDS.map((field) => (
                <label key={field.key} className="block text-xs text-zinc-500">
                  {field.label}
                  <textarea
                    rows={field.rows}
                    value={coachNotes[field.key] ?? ""}
                    onChange={(e) =>
                      setCoachNotes((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className={inputClass()}
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs text-zinc-500">
                Next block recommendation
                <select
                  value={recommendation}
                  onChange={(e) =>
                    setRecommendation(e.target.value as HyroxBlockReviewNextRecommendation | "")
                  }
                  className={inputClass()}
                >
                  <option value="">— Select —</option>
                  {BLOCK_REVIEW_RECOMMENDATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-500">
                Next block focus (short label)
                <input
                  type="text"
                  value={nextBlockFocus}
                  onChange={(e) => setNextBlockFocus(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. Threshold build, station density"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save block review"}
              </button>
              {toast ? <span className="text-sm text-emerald-300/90">{toast}</span> : null}
            </div>
          </DashCard>
        </>
      ) : null}
    </div>
  );
}
