"use client";

import { useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function Home() {
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

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Hybrid365 Blueprint
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Build Your Hybrid Week <span className="text-yellow-400">(60 seconds)</span>
          </h1>
          <p className="mt-3 text-zinc-300">
            Answer a few questions. We’ll generate your weekly blueprint and email it to you in ~20 minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-lg">
          <form onSubmit={onSubmit} className="space-y-6">
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
              {loading ? "Requesting..." : "Generate My Weekly Blueprint"}
            </button>

            {result && result.ok && (
              <div className="rounded-xl border border-green-800 bg-green-950/30 p-4 text-sm text-green-200 space-y-4">
                <p>
                  Your Hybrid365 Blueprint is being built.
                  <br />
                  Check your email in ~20 minutes.
                </p>

                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4">
                  <p className="mb-3 text-sm text-white">
                    While you wait, take a look at Hybrid Mastery and learn how to progress your training properly.
                  </p>

                  <a
                    href="https://www.levelete.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
                  >
                    Explore Hybrid Mastery
                  </a>
                </div>
              </div>
            )}

            {result && !result.ok && (
              <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
                {result.error || "Something went wrong"}
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By submitting, you agree to receive your blueprint by email. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}