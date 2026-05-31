"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  challengeModeFromSearchParam,
  FREE_WEEK_TELEGRAM_URL,
  type ChallengeMode,
} from "@/app/lib/freeWeekChallengeMode";
import SaveDashboardBanner from "@/components/free-week/SaveDashboardBanner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function FreeWeekForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [doubleSessions, setDoubleSessions] = useState(false);
  const [goalFocus, setGoalFocus] = useState<"running" | "muscle" | "hybrid">("hybrid");
  const [abilityLevel, setAbilityLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [equipment, setEquipment] = useState<string[]>(["Full gym"]);
  const [weeklyHoursBand, setWeeklyHoursBand] = useState<string>("5-7");
  const [fiveK, setFiveK] = useState("");
  const [notes, setNotes] = useState("");
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>("standard");

  const searchParams = useSearchParams();

  useEffect(() => {
    setChallengeMode(challengeModeFromSearchParam(searchParams.get("challenge")));
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; planUrl?: string; message?: string; error?: string } | null>(null);

  const equipmentOptions = useMemo(
    () => [
      "Full gym",
      "Dumbbells only",
      "Treadmill",
      "Bike / Spin bike",
      "Rower",
      "SkiErg",
      "Sled",
      "None (bodyweight only)",
    ],
    []
  );

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      first_name: firstName,
      email,
      days_per_week: Number(daysPerWeek),
      preferred_days: preferredDays,
      double_sessions: doubleSessions,
      goal_focus: goalFocus,
      ability_level: abilityLevel,
      equipment,
      weekly_hours_band: weeklyHoursBand,
      five_k_time: fiveK || undefined,
      notes: notes || undefined,
      challenge_mode: challengeMode,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  const isHybrid75Challenge = challengeMode === "hybrid75";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {isHybrid75Challenge ? (
          <div className="mb-8 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Hybrid 75 Summer Challenge</p>
            <h2 className="mt-2 text-2xl font-bold text-white">You&apos;re joining the Hybrid 75 Summer Challenge</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200 sm:text-base">
              Your free week will be built around the challenge rules — runs, lifts, mobility, daily habits, and the
              weekend Hybrid Hard Challenge.
            </p>
          </div>
        ) : null}

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            {isHybrid75Challenge ? "Hybrid 75 Challenge Builder" : "Hybrid365 Blueprint"}
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight leading-tight">
            {isHybrid75Challenge ? (
              <>
                Build Your{" "}
                <span className="text-yellow-400">Hybrid 75 Challenge Week</span>
              </>
            ) : (
              <>
                Get Your Personalised Hybrid Training Week
                <br />
                <span className="text-yellow-400">Built Using the Hybrid365 Method</span>
              </>
            )}
          </h1>

          <p className="mt-4 text-zinc-300 text-lg">
            {isHybrid75Challenge
              ? "Answer a few questions and get a structured challenge week personalised to your schedule, level and equipment."
              : "Answer a few questions and get a structured training week built around your goal, fitness level, and schedule."}
          </p>

          <div className="mt-6 space-y-2 text-sm text-zinc-300">
            <p>✓ Built around your goal, level & available time</p>
            <p>✓ Designed to improve performance and physique</p>
            <p>✓ Structured like real coaching — not random workouts</p>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            Built using the Hybrid365 method to develop strength, engine, and performance together.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold text-white">
            Most people don’t have a work ethic problem.
            <br />
            They have a structure problem.
          </h2>

          <p className="mt-3 text-zinc-300">Training hard isn’t the issue.</p>

          <p className="mt-2 text-zinc-300">
            Doing the right sessions, in the right order, with the right intent — that’s what actually drives progress.
          </p>

          <p className="mt-2 text-zinc-300">
            This is what your Hybrid365 week is built to show you.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-lg">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-sm text-zinc-400 space-y-1">
              <p>Takes 60 seconds</p>
              <p>Plan link delivered by email in around 10–15 minutes</p>
              <p>Includes coaching notes for every session</p>
            </div>

            <div>
              <label className="text-sm text-zinc-200">Are you joining the Hybrid 75 Summer Challenge?</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setChallengeMode("standard")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    challengeMode === "standard"
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <p className="font-semibold text-white">Standard Free Week</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Build me a personalised Hybrid365 training week.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setChallengeMode("hybrid75")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    challengeMode === "hybrid75"
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <p className="font-semibold text-white">Hybrid 75 Summer Challenge</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Build my week around the challenge rules: 3+ runs, 2–3 lifts, mobility, hydration, clean eating,
                    accountability and the weekly Hybrid Hard Challenge.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-200">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-200">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-zinc-200">Days per week</label>
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {[2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-200">Double sessions?</label>
                <button
                  type="button"
                  onClick={() => setDoubleSessions((v) => !v)}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-left ${
                    doubleSessions ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  {doubleSessions ? "Yes — sometimes" : "No — single sessions"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-200">Preferred training days (optional)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const active = preferredDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPreferredDays(toggle(preferredDays, d))}
                      className={`rounded-full border px-4 py-2 text-sm ${
                        active ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-zinc-200">Main focus</label>
                <select
                  value={goalFocus}
                  onChange={(e) => setGoalFocus(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                >
                  <option value="running">Run performance</option>
                  <option value="muscle">Build lean muscle</option>
                  <option value="hybrid">Hybrid performance (Hyrox-style)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-200">Training level</label>
                <select
                  value={abilityLevel}
                  onChange={(e) => setAbilityLevel(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-200">Equipment access</label>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {equipmentOptions.map((opt) => {
                  const active = equipment.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEquipment(toggle(equipment, opt))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm ${
                        active ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-zinc-200">Weekly hours</label>
                <select
                  value={weeklyHoursBand}
                  onChange={(e) => setWeeklyHoursBand(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {["2-3", "3-5", "5-7", "7-10", "10+"].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-200">5K time (optional)</label>
                <input
                  value={fiveK}
                  onChange={(e) => setFiveK(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                  placeholder="e.g. 19:30"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-200">Anything to work around? (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                placeholder="Short sessions only, no running Tuesday, knee niggle, etc."
                rows={3}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-zinc-950 transition hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? "Building..."
                : isHybrid75Challenge
                ? "Build My Hybrid 75 Challenge Week"
                : "Build My Personalised Week"}
            </button>

            {result && result.ok && (
              <div className="rounded-xl border border-green-800 bg-green-950/30 p-4 text-sm text-green-200 space-y-4">
                <p className="text-white font-semibold">Your Hybrid365 plan is being prepared.</p>

                <p>
                  Your personalised week is now being built from the Hybrid365 programming system.
                  Your access link will arrive by email in around 10–15 minutes.
                </p>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-200">
                  <p className="text-white font-semibold">What happens next:</p>
                  <p className="mt-2">
                    Analysing your goal. Matching your training days. Checking equipment and constraints.
                    Building from the Hybrid365 session library.
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4">
                  <p className="mb-3 text-sm text-white">
                    We&apos;re using your goal, training days, weekly hours, running profile, equipment and notes to
                    structure your week. Check your inbox and junk folder — your plan link should arrive shortly.
                  </p>

                  {result.planUrl ? (
                    <>
                      <a
                        href={result.planUrl}
                        className="mb-3 inline-block rounded-lg border border-yellow-400/40 bg-zinc-900 px-4 py-2 text-sm font-semibold text-yellow-400 hover:opacity-90 transition"
                      >
                        Open your plan (when ready)
                      </a>
                      <SaveDashboardBanner planUrl={result.planUrl} variant="card" />
                    </>
                  ) : null}

                  <a
                    href="https://www.hybrid-365.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
                  >
                    Explore Hybrid365
                  </a>
                </div>

                {isHybrid75Challenge ? (
                  <div className="rounded-lg border border-[#F4D23C]/35 bg-zinc-900/60 p-4">
                    <p className="font-semibold text-white">Next step: join the free Telegram group</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      The weekly Hybrid Hard Challenge workout, proof posts, leaderboard updates and prize information
                      will be released inside the Telegram group.
                    </p>
                    <a
                      href={FREE_WEEK_TELEGRAM_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block rounded-lg bg-[#F4D23C] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      Join the Telegram group
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {result && !result.ok && (
              <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
                {result.error || "Something went wrong"}
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          This is how you stop guessing your training and start progressing.
        </p>

        <p className="mt-3 text-center text-xs text-zinc-500">
          By submitting, you agree to receive your blueprint by email. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 px-4 py-12 text-center text-zinc-400">Loading assessment form…</div>
      }
    >
      <FreeWeekForm />
    </Suspense>
  );
}
