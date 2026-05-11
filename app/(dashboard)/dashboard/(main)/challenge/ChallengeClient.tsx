"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  LineChart,
  ListChecks,
  Trophy,
} from "lucide-react";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import { countHabitsHit, HABIT_TOTAL } from "@/app/lib/dailyHabitLogs";
import {
  HYBRID_CHALLENGE_DURATION_WEEKS,
  HYBRID_CHALLENGE_NAME,
  HYBRID_CHALLENGE_POINTS,
  HYBRID_CHALLENGE_RULES,
  HYBRID_CHALLENGE_TAGLINE,
  getChallengeWeekSpec,
} from "@/app/lib/hybridChallengeConfig";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import type {
  ChallengeSubmissionRow,
  HybridBaselineChecklist,
  LeaderboardAggregate,
  WeeklyTrainingSnapshot,
} from "@/app/lib/hybridChallengeMetrics";

type Provisional = {
  habitWindowPoints: number;
  habitTodayPoints: number;
  checkInPoints: number;
  sessionPoints: number;
  approvedSubmissionPoints: number;
  total: number;
};

type Baseline = HybridBaselineChecklist;

type Props = {
  userId: string;
  programmeInstanceId: string | null;
  displayWeek: number;
  programmeWeekForPlan: number;
  dayLabel: string;
  weeklySnap: WeeklyTrainingSnapshot;
  habitLogs: DailyHabitLogRow[];
  todayYmd: string;
  provisional: Provisional;
  submissionForDisplayWeek: ChallengeSubmissionRow | null;
  leaderboard: LeaderboardAggregate[];
  userRank: number | null;
  baseline: Baseline;
};

export default function ChallengeClient({
  userId: _userId,
  programmeInstanceId,
  displayWeek,
  programmeWeekForPlan,
  dayLabel,
  weeklySnap,
  habitLogs,
  todayYmd,
  provisional,
  submissionForDisplayWeek,
  leaderboard,
  userRank,
  baseline,
}: Props) {
  void _userId;
  const router = useRouter();
  const weekSpec = useMemo(() => getChallengeWeekSpec(displayWeek), [displayWeek]);
  const todayHabitsDone = useMemo(() => {
    const row = habitLogs.find((l) => l.log_date === todayYmd);
    return countHabitsHit(row ?? null);
  }, [habitLogs, todayYmd]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [scoreTime, setScoreTime] = useState("");
  const [scoreValue, setScoreValue] = useState("");
  const [scoreUnit, setScoreUnit] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");

  const leaderboardHasPoints = leaderboard.some((r) => r.totalPoints > 0);

  function openModal() {
    if (!weekSpec) return;
    setFormError(null);
    setSubmitSuccess(null);
    const existing = submissionForDisplayWeek;
    setScoreTime(existing?.score_time ?? "");
    setScoreValue(existing?.score_value != null ? String(existing.score_value) : "");
    setScoreUnit(existing?.score_unit ?? "");
    setProofUrl(existing?.proof_url ?? "");
    setProofNote(existing?.proof_note ?? "");
    setModalOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weekSpec) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/dashboard/challenge-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          challenge_week: weekSpec.week,
          challenge_key: weekSpec.challengeKey,
          challenge_title: weekSpec.title,
          score_time: scoreTime.trim() || null,
          score_value: scoreValue.trim() ? Number(scoreValue) : null,
          score_unit: scoreUnit.trim() || null,
          proof_url: proofUrl.trim() || null,
          proof_note: proofNote.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Submit failed");
      setModalOpen(false);
      setSubmitSuccess(
        "Score submitted and added to the leaderboard. Proof may be reviewed and points can be removed if required."
      );
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  const sub = submissionForDisplayWeek;
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-8 md:px-8 md:pt-10">
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Hybrid365</p>
          <div className="mt-3">
            <DashboardSubnav variant="zinc" />
          </div>

          <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-400/[0.06] to-zinc-950 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{HYBRID_CHALLENGE_NAME}</h1>
                <p className="mt-2 text-lg text-yellow-200/90">{HYBRID_CHALLENGE_TAGLINE}</p>
                <p className="mt-4 max-w-2xl border-l-2 border-yellow-400/40 pl-5 text-base font-medium leading-relaxed tracking-tight text-zinc-200 sm:text-lg">
                  Train hard, stay disciplined, track your progress and earn rewards for consistency.
                </p>
                <p className="mt-4 text-sm text-zinc-400">
                  {HYBRID_CHALLENGE_DURATION_WEEKS}-week accountability layer · {dayLabel}
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Active
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Provisional points</p>
                <p className="mt-1 text-2xl font-bold text-white">{provisional.total}</p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  Habits, check-ins, sessions, plus weekly challenge submits. Coaches may adjust challenge points after
                  review.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Challenge week</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {displayWeek} <span className="text-sm font-normal text-zinc-500">/ {HYBRID_CHALLENGE_DURATION_WEEKS}</span>
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">Mapped from programme week (capped at 6).</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Your rank</p>
                <p className="mt-1 text-2xl font-bold text-white">{userRank != null ? `#${userRank}` : "—"}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Leaderboard updates instantly after you submit; only approved rows count and rejected entries are
                  hidden.
                </p>
              </div>
            </div>
          </div>
        </header>

        {submitSuccess ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100">
            {submitSuccess}
          </div>
        ) : null}

        {!programmeInstanceId ? (
          <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-400/[0.06] to-zinc-950 p-5 sm:p-6">
            <p className="text-sm font-semibold text-yellow-200/95">Train. Track. Prove.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Start by completing your programme setup on the dashboard — assessment, optional baselines, then generate
              your 12-week plan. Earn the result with structure, not guesswork.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              Go to dashboard
            </Link>
          </div>
        ) : null}

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Train",
              icon: Dumbbell,
              body: "Complete sessions, aim for 2 runs and 2 strength slots weekly, recover between hard days.",
            },
            {
              title: "Track",
              icon: LineChart,
              body: "Daily habits, weekly check-ins, and benchmarks keep the story honest.",
            },
            {
              title: "Prove",
              icon: Camera,
              body: "Telegram / community proof, challenge submissions, and optional session share cards.",
            },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/12 ring-1 ring-yellow-400/25">
                <p.icon className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </section>

        <p className="mb-8 text-sm leading-relaxed text-zinc-400">
          Weekly challenge submissions add{" "}
          <span className="font-semibold text-zinc-200">{HYBRID_CHALLENGE_POINTS.weeklyChallengeSubmission} points</span>{" "}
          as soon as you submit. Other totals: habits (42-day window) {provisional.habitWindowPoints} pts · check-ins
          (weeks 1–6) {provisional.checkInPoints} · sessions (weeks 1–6) {provisional.sessionPoints} · prior approved
          challenge rows {provisional.approvedSubmissionPoints}. Coaches may lower points or reject a row if proof does
          not hold up.
        </p>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Today&apos;s accountability</h2>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-white">
                {todayHabitsDone}
                <span className="text-lg font-semibold text-zinc-500">/{HABIT_TOTAL}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">Habits completed today</p>
              <p className="mt-2 text-sm text-yellow-200/80">Today&apos;s habit points: {provisional.habitTodayPoints}</p>
            </div>
            <Link
              href="/dashboard/habits"
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-4 py-2.5 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/15"
            >
              <ListChecks className="h-4 w-4" />
              Open habits
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Weekly requirements</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Programme week {programmeWeekForPlan} (schedule-based, approximate run/lift split).
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li className="flex justify-between gap-4 border-b border-zinc-800/80 py-2">
              <span>Sessions completed</span>
              <span className="font-semibold text-white">
                {weeklySnap.sessionsCompleted}/{weeklySnap.sessionsTotal || "—"}
              </span>
            </li>
            <li className="flex justify-between gap-4 border-b border-zinc-800/80 py-2">
              <span>Runs completed (est.)</span>
              <span className="font-semibold text-white">
                {weeklySnap.runsCompleted}/{weeklySnap.runsPlanned || "—"}
              </span>
            </li>
            <li className="flex justify-between gap-4 border-b border-zinc-800/80 py-2">
              <span>Lifts completed (est.)</span>
              <span className="font-semibold text-white">
                {weeklySnap.liftsCompleted}/{weeklySnap.liftsPlanned || "—"}
              </span>
            </li>
            <li className="flex justify-between gap-4 border-b border-zinc-800/80 py-2">
              <span>Weekly check-in</span>
              <span className="font-semibold text-emerald-300">{weeklySnap.checkInDone ? "Done" : "Due"}</span>
            </li>
            <li className="flex justify-between gap-4 py-2">
              <span>Challenge workout submitted</span>
              <span className="font-semibold text-white">
                {sub?.status === "approved"
                  ? `Submitted (+${typeof sub.points_awarded === "number" ? sub.points_awarded : HYBRID_CHALLENGE_POINTS.weeklyChallengeSubmission} pts)`
                  : sub?.status === "pending"
                    ? "Pending (legacy — resubmit to auto-approve, or update in Supabase)"
                    : sub?.status === "rejected"
                      ? "Rejected"
                      : "Not yet"}
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Baseline checklist</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Log benchmarks from Testing — body, run, engine, and strength. Progress photos coming soon.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["Bodyweight", baseline.body],
              ["Run marker (5 km or 3 km)", baseline.run],
              ["Engine marker (Ski or Row)", baseline.engine],
              ["Strength marker", baseline.strength],
            ].map(([label, ok]) => (
              <li
                key={String(label)}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
              >
                <span className="text-zinc-300">{label}</span>
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-xs text-zinc-600">Missing</span>
                )}
              </li>
            ))}
            <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm sm:col-span-2">
              <span className="text-zinc-300">Progress photos</span>
              <span className="text-xs text-zinc-500">Coming soon</span>
            </li>
          </ul>
          <Link
            href="/dashboard/testing"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-yellow-400/90 hover:text-yellow-300"
          >
            Open testing / benchmarks
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        {weekSpec ? (
          <section id="weekly-challenge" className="mb-10 rounded-2xl border border-yellow-500/20 bg-yellow-400/[0.04] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">This week</p>
                <h2 className="mt-1 text-xl font-bold text-white">{weekSpec.title}</h2>
                <p className="mt-2 text-sm text-zinc-400">{weekSpec.purpose}</p>
              </div>
              {sub?.status === "approved" ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Approved
                </span>
              ) : sub?.status === "pending" ? (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                  Legacy pending
                </span>
              ) : sub?.status === "rejected" ? (
                <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">
                  Rejected
                </span>
              ) : null}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {weekSpec.workoutLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-yellow-500">·</span>
                  {line}
                </li>
              ))}
            </ul>
            {weekSpec.scalingNote ? (
              <p className="mt-4 text-sm italic text-zinc-500">Scaling: {weekSpec.scalingNote}</p>
            ) : null}
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Score format</p>
            <p className="text-sm text-zinc-300">{weekSpec.scoreFormat}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openModal}
                disabled={sub?.status === "rejected"}
                className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sub?.status === "rejected"
                  ? "Submission locked"
                  : sub?.status === "approved"
                    ? "Update submission"
                    : sub?.status === "pending"
                      ? "Complete submission"
                      : "Submit score / proof"}
              </button>
              {!sub ? (
                <span className="self-center text-xs text-zinc-500">
                  Earn {HYBRID_CHALLENGE_POINTS.weeklyChallengeSubmission} points instantly on submit.
                </span>
              ) : sub.status === "rejected" ? (
                <span className="self-center text-xs text-red-300/90">Contact support to re-open a rejected submission.</span>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="mb-10 text-sm text-zinc-500">Challenge workout config missing for this week index.</p>
        )}

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
              <p className="text-sm leading-relaxed text-zinc-300">
                No leaderboard rows yet. Train with intent, submit your weekly score with proof — you appear as soon as
                it&apos;s approved. Stronger, fitter, faster starts with showing up on the board.
              </p>
              {weekSpec ? (
                <button
                  type="button"
                  onClick={openModal}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                >
                  Submit weekly score
                </button>
              ) : null}
            </div>
          ) : !leaderboardHasPoints ? (
            <p className="text-sm text-zinc-400">
              Leaderboard lists athletes, but everyone is on 0 points right now. Scores may be adjusted if proof is
              missing or inaccurate.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Athlete</th>
                    <th className="py-2 pr-3">Points</th>
                    <th className="py-2 pr-3">Week</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => {
                    const top = row.entries[0];
                    const scoreBits = [top?.score_time, top?.score_value != null ? `${top.score_value} ${top?.score_unit ?? ""}`.trim() : ""]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <tr key={row.userId} className="border-b border-zinc-800/80">
                        <td className="py-2 pr-3 font-semibold text-white">{row.rank}</td>
                        <td className="py-2 pr-3 text-zinc-300">{row.displayLabel}</td>
                        <td className="py-2 pr-3 text-yellow-200">{row.totalPoints}</td>
                        <td className="py-2 pr-3 text-zinc-400">{top?.challenge_week ?? "—"}</td>
                        <td className="py-2 text-zinc-400">{scoreBits || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Leaderboard updates instantly after submission. Scores may be adjusted if proof is missing or inaccurate.
            Rejected submissions are hidden here.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Older rows still marked pending in Supabase can be set to approved with points, or deleted, from the
            dashboard table.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Read policy: approved rows are visible to all signed-in members for accountability (no email exposed).
          </p>
        </section>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-white">Challenge rules</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            {HYBRID_CHALLENGE_RULES.map((r) => (
              <li key={r} className="flex gap-2">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" />
                {r}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-center pb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to dashboard
          </Link>
        </div>
      </div>

      {modalOpen && weekSpec ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 m-4 max-h-[min(90vh,800px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:m-6 sm:p-6">
            <h3 className="text-lg font-bold text-white">Submit score / proof</h3>
            <p className="mt-1 text-sm text-zinc-500">{weekSpec.title}</p>
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
              <p className="font-semibold text-white">Proof rules</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 leading-relaxed">
                <li>Post your proof in the Telegram group.</li>
                <li>If you share on Instagram, tag @hybrid.365 or @kieranhiggs.</li>
                <li>Add your proof link or context below.</li>
                <li>Scores can be removed if proof is missing or inaccurate.</li>
              </ol>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                Proof URL is useful but not required if you already posted in Telegram — use the note to say where proof
                lives. Leaderboard scores are subject to review.
              </p>
            </div>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Score time</span>
                <input
                  value={scoreTime}
                  onChange={(e) => setScoreTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="e.g. 24:15 or 24.25 min"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Score value</span>
                  <input
                    value={scoreValue}
                    onChange={(e) => setScoreValue(e.target.value)}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                    placeholder="Reps / rounds / distance"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Score unit</span>
                  <input
                    value={scoreUnit}
                    onChange={(e) => setScoreUnit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                    placeholder="m, rounds, etc."
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Proof URL (optional)</span>
                <input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="Link if you have one — skip if proof is only in Telegram"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Proof note</span>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="Where you posted proof (e.g. Telegram thread), scaling, or other context"
                />
              </label>
              {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                  className="min-h-[48px] flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
                >
                  {saving ? "Submitting…" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[48px] rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


