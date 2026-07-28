"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BoxCrossLeaderboardPayload,
  BoxCrossLeaderboardRow,
  BoxCrossLeaderboardTab,
} from "@/app/lib/boxcross/types";
import {
  BOXCROSS_GYM,
  BOXCROSS_LOGO_PLACEHOLDER_PATH,
} from "@/app/lib/boxcross/types";

const RED = "#E10600";
const POLL_MS = 30_000;

const SETUP_STEPS = [
  { n: "01", title: "Select Workout", body: "On the Concept2 SkiErg monitor, open Workout." },
  { n: "02", title: "Select New Workout", body: "Choose New Workout from the menu." },
  { n: "03", title: "Select Single Distance", body: "Pick Single Distance as the workout type." },
  { n: "04", title: "Set 1,000m", body: "Enter exactly 1,000 metres — not a calorie or timed piece." },
  { n: "05", title: "Confirm & Begin", body: "Confirm the workout, then start the attempt when ready." },
] as const;

const ENTRY_STEPS = [
  {
    n: "01",
    title: "Visit BoxCross UK Gym Wisbech",
    body: "The challenge is completed in-gym on the Concept2 SkiErg.",
  },
  {
    n: "02",
    title: "Ask staff to verify",
    body: "Have an authorised BoxCross staff member witness your attempt or fully record it.",
  },
  {
    n: "03",
    title: "Ski 1,000m as fast as possible",
    body: "Monitor must be set to exactly 1,000m before you start.",
  },
  {
    n: "04",
    title: "Staff submits the verified time",
    body: "Only authorised BoxCross admins add results to the live leaderboard.",
  },
] as const;

const RULES = [
  "Distance must be exactly 1,000m.",
  "Attempt must be fully recorded or witnessed by BoxCross staff.",
  "Final monitor result must be clearly visible.",
  "Only verified attempts appear on the leaderboard.",
  "Athlete category (Male / Female) must be recorded correctly.",
  "Fastest verified male and female times at the challenge deadline win.",
  "BoxCross may reject incomplete or unclear submissions.",
  "Any disputed result is subject to staff review.",
  "Attempts must be completed during the official 30-day challenge period.",
  "Damper setting is athlete choice.",
] as const;

function useCountdown(endIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!endIso) return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const end = new Date(endIso).getTime();
    const diff = Math.max(0, end - now);
    const expired = diff <= 0;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);
    return { expired, days, hours, minutes, seconds };
  }, [endIso, now]);
}

function formatStamp(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAttemptDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

function rankTone(rank: number) {
  if (rank === 1) return "border-[#E10600] bg-[#E10600]/15 text-white";
  if (rank === 2) return "border-zinc-400/50 bg-zinc-400/10 text-zinc-100";
  if (rank === 3) return "border-amber-700/60 bg-amber-900/20 text-amber-100";
  return "border-zinc-800 bg-zinc-950/60 text-zinc-200";
}

export default function BoxCrossSkiChallengeClient() {
  const [tab, setTab] = useState<BoxCrossLeaderboardTab>("overall");
  const [payload, setPayload] = useState<BoxCrossLeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);

  const load = useCallback(async (activeTab: BoxCrossLeaderboardTab, soft = false) => {
    if (!soft) setLoading(true);
    try {
      const res = await fetch(`/api/boxcross/leaderboard?tab=${activeTab}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load leaderboard");
        setPayload(null);
        return;
      }
      setPayload(data as BoxCrossLeaderboardPayload);
      setError(null);
    } catch {
      setError("Unable to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
    const id = window.setInterval(() => void load(tab, true), POLL_MS);
    return () => window.clearInterval(id);
  }, [tab, load]);

  const countdown = useCountdown(payload?.challenge.end_date ?? null);
  const videoUrl =
    payload?.challenge.video_url ||
    process.env.NEXT_PUBLIC_BOXCROSS_SKI_VIDEO_URL ||
    "";

  const winnersFinal = payload?.challenge.is_final;

  return (
    <div className="relative overflow-x-hidden">
      {/* Industrial grit */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 border-b border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src={BOXCROSS_LOGO_PLACEHOLDER_PATH}
              alt="BoxCross"
              width={52}
              height={52}
              className="h-12 w-12 border border-[#E10600] object-cover"
              priority
              unoptimized
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E10600]">
                BoxCross UK · Wisbech
              </p>
              <p
                className="text-lg uppercase leading-none tracking-wide text-white sm:text-xl"
                style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
              >
                1KM Ski Challenge
              </p>
            </div>
          </div>
          <a
            href="#leaderboard"
            className="hidden border border-[#E10600] bg-[#E10600] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-transparent sm:inline-flex"
          >
            Live Board
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 border-b border-zinc-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#E10600]">
              30-Day In-Gym Challenge
            </p>
            <h1
              className="text-5xl uppercase leading-[0.92] text-white sm:text-6xl md:text-7xl"
              style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
            >
              BoxCross
              <br />
              1KM Ski Challenge
            </h1>
            <p
              className="mt-5 text-2xl uppercase tracking-wide text-zinc-200 sm:text-3xl"
              style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
            >
              1,000m. As fast as possible.
            </p>
            <p className="mt-3 max-w-xl text-sm uppercase tracking-wide text-zinc-400 sm:text-base">
              30 days. Two winners. £200 in Bulk prizes.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#leaderboard"
                className="inline-flex items-center justify-center bg-[#E10600] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
              >
                View Live Leaderboard
              </a>
              <a
                href="#how-to-enter"
                className="inline-flex items-center justify-center border border-zinc-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:border-white"
              >
                How To Enter
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PrizeChip label="Male Winner" value="£100 Bulk" />
              <PrizeChip label="Female Winner" value="£100 Bulk" />
              <PrizeChip label="Distance" value="1,000m" />
              <PrizeChip label="Verified Only" value="Staff / Video" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/5] overflow-hidden border border-zinc-800 bg-zinc-950 sm:aspect-[5/4] lg:aspect-auto lg:min-h-[360px]">
              <Image
                src="/images/homepage/team/ben-kelly-ski-erg.png"
                alt="Athlete on Concept2 SkiErg"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#E10600]">Concept2 SkiErg</p>
                <p
                  className="text-2xl uppercase text-white"
                  style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
                >
                  Set the standard
                </p>
              </div>
            </div>

            <CountdownBlock countdown={countdown} isFinal={Boolean(winnersFinal)} />
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" className="relative z-10 scroll-mt-4 border-b border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    payload?.challenge.is_final ? "bg-zinc-500" : "animate-pulse bg-[#E10600]"
                  }`}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E10600]">
                  {payload?.challenge.is_final ? "Final Results" : "Live"}
                </span>
              </div>
              <h2
                className="text-4xl uppercase text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
              >
                Live Leaderboard
              </h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                Verified attempts only. Updated throughout the 30-day challenge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load(tab)}
              className="border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-white hover:text-white"
            >
              Refresh
            </button>
          </div>

          {winnersFinal && payload ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <WinnerCard
                title="Male Winner"
                row={payload.stats.male_leader}
                prize={payload.challenge.male_prize}
              />
              <WinnerCard
                title="Female Winner"
                row={payload.stats.female_leader}
                prize={payload.challenge.female_prize}
              />
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Verified Attempts" value={String(payload?.stats.total_verified_attempts ?? 0)} />
            <Stat
              label="Fastest Overall"
              value={payload?.stats.fastest_overall?.time_display ?? "—"}
              sub={payload?.stats.fastest_overall?.athlete_name}
            />
            <Stat
              label="Male Leader"
              value={payload?.stats.male_leader?.time_display ?? "—"}
              sub={payload?.stats.male_leader?.athlete_name}
            />
            <Stat
              label="Female Leader"
              value={payload?.stats.female_leader?.time_display ?? "—"}
              sub={payload?.stats.female_leader?.athlete_name}
            />
          </div>

          <div className="mt-6 flex gap-2 border-b border-zinc-800">
            {(["overall", "male", "female"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-11 flex-1 px-3 py-3 text-xs font-bold uppercase tracking-wider transition sm:flex-none sm:px-5 ${
                  tab === t
                    ? "border-b-2 border-[#E10600] text-white"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] uppercase tracking-wider text-zinc-500">
            Last updated: {formatStamp(payload?.stats.last_updated ?? payload?.generated_at)}
          </p>

          {error ? (
            <p className="mt-6 border border-zinc-800 bg-zinc-950 px-4 py-6 text-sm text-zinc-400">
              {error}. Run migration <code className="text-zinc-300">019_boxcross_ski_challenge.sql</code>{" "}
              and configure Supabase to enable the live board.
            </p>
          ) : loading && !payload ? (
            <p className="mt-6 text-sm text-zinc-500">Loading leaderboard…</p>
          ) : !payload?.rows.length ? (
            <p className="mt-6 border border-dashed border-zinc-700 bg-zinc-950/80 px-4 py-10 text-center text-sm text-zinc-400">
              No verified attempts yet. Be the first to set the standard.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-hidden border border-zinc-800 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Athlete</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-t border-zinc-900 transition motion-safe:animate-[fadeIn_0.35s_ease] ${
                          row.rank <= 3 ? "bg-red-950/20" : ""
                        } ${row.isNewest ? "ring-1 ring-inset ring-[#E10600]/40" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center border text-xs font-bold ${rankTone(row.rank)}`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold uppercase tracking-wide">
                          {row.athlete_name}
                          <RowBadges row={row} />
                        </td>
                        <td
                          className="px-4 py-3 text-xl tabular-nums text-white"
                          style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
                        >
                          {row.time_display}
                        </td>
                        <td className="px-4 py-3 uppercase text-zinc-400">{row.category}</td>
                        <td className="px-4 py-3 text-zinc-400">{formatAttemptDate(row.attempted_at)}</td>
                        <td className="px-4 py-3 text-xs uppercase tracking-wide text-zinc-300">
                          {row.verification_method === "full_video" ? "Video" : "Staff"}
                          {row.witness_name ? ` · ${row.witness_name}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-3 md:hidden">
                {payload.rows.map((row) => (
                  <article
                    key={row.id}
                    className={`border p-4 ${rankTone(row.rank)} ${row.isNewest ? "ring-1 ring-[#E10600]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                          Rank {row.rank} · {row.category}
                        </p>
                        <p className="mt-1 text-base font-bold uppercase tracking-wide">{row.athlete_name}</p>
                        <RowBadges row={row} />
                      </div>
                      <p
                        className="text-3xl tabular-nums leading-none"
                        style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
                      >
                        {row.time_display}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider text-zinc-400">
                      <span>{formatAttemptDate(row.attempted_at)}</span>
                      <span>
                        {row.verification_method === "full_video" ? "Video verified" : "Staff witnessed"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* PRIZES */}
      <section id="prizes" className="relative z-10 border-b border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2
            className="text-4xl uppercase text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
          >
            Prizes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-[#E10600] bg-black p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E10600]">
                Fastest Male
              </p>
              <p
                className="mt-3 text-4xl uppercase text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
              >
                £100 Bulk Nutrition
              </p>
            </div>
            <div className="border border-[#E10600] bg-black p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E10600]">
                Fastest Female
              </p>
              <p
                className="mt-3 text-4xl uppercase text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
              >
                £100 Bulk Nutrition
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-zinc-400">
            Winner receives £100 to spend with Bulk Nutrition.
          </p>
        </div>
      </section>

      {/* HOW TO ENTER */}
      <section id="how-to-enter" className="relative z-10 scroll-mt-4 border-b border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2
            className="text-4xl uppercase text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
          >
            How To Enter
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ENTRY_STEPS.map((step) => (
              <div key={step.n} className="border border-zinc-800 bg-zinc-950/50 p-5">
                <p className="text-xs font-bold tracking-[0.25em] text-[#E10600]">{step.n}</p>
                <h3 className="mt-2 text-lg font-semibold uppercase tracking-wide">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 space-y-2 text-sm text-zinc-400">
            <li>• All attempts must show the full SkiErg setup and final result.</li>
            <li>• Only one verified time per attempt.</li>
            <li>• Athletes may reattempt during the 30-day period.</li>
            <li>• The fastest verified result remains on the public leaderboard.</li>
          </ul>
        </div>
      </section>

      {/* SETUP */}
      <section id="setup" className="relative z-10 border-b border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2
            className="text-4xl uppercase text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
          >
            SkiErg Setup
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Match the Concept2 monitor flow before every attempt.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SETUP_STEPS.map((step) => (
              <div key={step.n} className="border border-zinc-800 bg-black p-4">
                <p className="text-2xl font-bold text-[#E10600]" style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}>
                  {step.n}
                </p>
                <h3 className="mt-2 text-sm font-semibold uppercase tracking-wide">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-l-4 border-[#E10600] bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
            The monitor must be set to exactly 1,000m before starting.
          </p>
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="relative z-10 border-b border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2
            className="text-4xl uppercase text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
          >
            Watch The Challenge Brief
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            See the correct setup, rules and how your attempt must be verified.
          </p>
          <div className="mt-8 aspect-video overflow-hidden border border-zinc-800 bg-black">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title="BoxCross 1KM Ski Challenge brief"
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-[#E10600]">Video placeholder</p>
                <p className="max-w-md text-sm text-zinc-400">
                  Add the coach challenge video URL to the challenge record (
                  <code className="text-zinc-300">video_url</code>) or set{" "}
                  <code className="text-zinc-300">NEXT_PUBLIC_BOXCROSS_SKI_VIDEO_URL</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RULES */}
      <section id="rules" className="relative z-10 border-b border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left md:pointer-events-none"
            onClick={() => setRulesOpen((v) => !v)}
          >
            <h2
              className="text-4xl uppercase text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
            >
              Rules
            </h2>
            <span className="text-xs uppercase tracking-wider text-zinc-500 md:hidden">
              {rulesOpen ? "Hide" : "Show"}
            </span>
          </button>
          <ul
            className={`mt-6 space-y-3 text-sm text-zinc-300 ${rulesOpen ? "block" : "hidden md:block"}`}
          >
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-3 border-b border-zinc-900 pb-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#E10600]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LOCATION CTA */}
      <section id="location" className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2
            className="text-4xl uppercase text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
          >
            Ready To Set Your Time?
          </h2>
          <p className="mt-4 text-lg font-semibold uppercase tracking-wide text-zinc-200">
            {BOXCROSS_GYM.name}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{BOXCROSS_GYM.addressLine}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#how-to-enter"
              className="inline-flex bg-[#E10600] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              Attempt The Challenge At BoxCross
            </a>
            <a
              href="#leaderboard"
              className="inline-flex border border-zinc-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              View Leaderboard
            </a>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-black/95 p-3 backdrop-blur md:hidden">
        <a
          href="#leaderboard"
          className="flex min-h-12 w-full items-center justify-center bg-[#E10600] text-sm font-bold uppercase tracking-wider text-white"
          style={{ color: "white", backgroundColor: RED }}
        >
          View Live Leaderboard
        </a>
      </div>
      <div className="h-16 md:hidden" />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[fadeIn_0\\.35s_ease\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function PrizeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 bg-black px-3 py-3">
      <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-zinc-800 bg-black px-4 py-3">
      <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p
        className="mt-1 text-2xl uppercase text-white"
        style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 truncate text-xs text-zinc-400">{sub}</p> : null}
    </div>
  );
}

function CountdownBlock({
  countdown,
  isFinal,
}: {
  countdown: { expired: boolean; days: number; hours: number; minutes: number; seconds: number };
  isFinal: boolean;
}) {
  if (isFinal || countdown.expired) {
    return (
      <div className="border border-zinc-700 bg-black p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Challenge Status</p>
        <p
          className="mt-2 text-3xl uppercase text-white"
          style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
        >
          Final
        </p>
      </div>
    );
  }

  const cells = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
  ];

  return (
    <div className="border border-zinc-800 bg-black p-4">
      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[#E10600]">
        Time Remaining
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="border border-zinc-900 bg-zinc-950 px-2 py-3 text-center">
            <p
              className="text-3xl tabular-nums text-white"
              style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
            >
              {String(c.value).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnerCard({
  title,
  row,
  prize,
}: {
  title: string;
  row: BoxCrossLeaderboardRow | null;
  prize: string;
}) {
  return (
    <div className="border border-[#E10600] bg-black p-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#E10600]">{title}</p>
      <p
        className="mt-2 text-3xl uppercase text-white"
        style={{ fontFamily: "var(--font-boxcross-display), sans-serif" }}
      >
        {row?.athlete_name ?? "TBC"}
      </p>
      <p className="mt-1 text-xl tabular-nums text-zinc-200">{row?.time_display ?? "—"}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{prize}</p>
    </div>
  );
}

function RowBadges({ row }: { row: BoxCrossLeaderboardRow }) {
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {row.isMaleLeader ? (
        <span className="bg-[#E10600] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          Male Lead
        </span>
      ) : null}
      {row.isFemaleLeader ? (
        <span className="bg-[#E10600] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          Female Lead
        </span>
      ) : null}
      {row.isNewest ? (
        <span className="border border-[#E10600] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E10600]">
          Newest
        </span>
      ) : null}
    </span>
  );
}
