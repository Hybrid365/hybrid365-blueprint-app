import Link from "next/link";
import type { HyroxFreeWeekMeta } from "@/app/lib/freeWeekChallengeMode";

export function HyroxFreeWeekHero({
  meta,
  firstName,
}: {
  meta: HyroxFreeWeekMeta;
  firstName: string;
}) {
  return (
    <div className="rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 via-zinc-900 to-zinc-950 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
            HYROX Free Week
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {firstName ? `${firstName}, your` : "Your"}{" "}
            <span className="text-yellow-400">HYROX Week 1</span> sample
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
            Your free HYROX week is built around your current running level, training availability,
            equipment and selected limiter:{" "}
            <span className="font-semibold text-white">{meta.limiter}</span>.
          </p>
        </div>
        {meta.race_countdown_days != null ? (
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Race countdown</p>
            <p className="text-2xl font-bold text-yellow-300">{meta.race_countdown_days} days</p>
            {meta.race_target_time ? (
              <p className="text-xs text-zinc-500">Target {meta.race_target_time}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
          Limiter: {meta.limiter}
        </span>
        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
          Station focus: {meta.station_focus}
        </span>
        {meta.station_weaknesses.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HyroxTargetCards({ meta }: { meta: HyroxFreeWeekMeta }) {
  const cards = [
    { label: "Threshold run", value: meta.threshold_pace, fallback: "RPE 7–8" },
    { label: "Easy aerobic", value: meta.easy_pace, fallback: "RPE 2–4" },
    { label: "SkiErg target", value: meta.ski_target, fallback: "RPE 7–8" },
    { label: "RowErg target", value: meta.row_target, fallback: "RPE 7–8" },
  ].filter((c) => c.value || c.fallback);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {c.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-yellow-200">
            {c.value ?? c.fallback}
          </p>
        </div>
      ))}
    </div>
  );
}

export function HyroxPersonalisationNotes({ meta }: { meta: HyroxFreeWeekMeta }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
        How this week was built
      </p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-400">
        {meta.personalisation_lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-yellow-400/80">→</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {meta.methodology_notes.map((n) => (
          <span
            key={n}
            className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-500"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HyroxUpgradeSection({ meta }: { meta: HyroxFreeWeekMeta }) {
  return (
    <div className="rounded-3xl border border-yellow-400/25 bg-gradient-to-b from-yellow-400/10 to-transparent p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Next step</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Want the full 12-week HYROX progression?</h2>
      <p className="mt-3 max-w-2xl text-sm text-zinc-400">
        This free week is a Week 1 sample with generated targets — no manual coach review. The paid
        Hybrid365 HYROX Track gives you structured progression, dashboard access, check-ins and
        community accountability. HYROX Team is the next step for higher-touch 1-1 coaching.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={meta.upgrade_cta.community_url}
          className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
        >
          Join the Hybrid365 HYROX Track
        </Link>
        <Link
          href={meta.upgrade_cta.hyrox_team_url}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-600 px-6 py-3 text-sm font-semibold text-white hover:border-zinc-400"
        >
          Explore HYROX Team coaching
        </Link>
      </div>
    </div>
  );
}
