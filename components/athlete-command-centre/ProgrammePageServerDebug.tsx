"use client";

import Link from "next/link";
import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";

export function ProgrammePageServerDebugPanel({
  debug,
  variant,
  layoutTrustsAthlete = false,
  serverVariantFailed = false,
}: {
  debug: ProgrammePageServerDebug;
  variant: string;
  layoutTrustsAthlete?: boolean;
  serverVariantFailed?: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mb-6 rounded-xl border border-cyan-500/35 bg-cyan-950/25 p-4 text-left text-xs text-cyan-100/90">
      <p className="font-bold uppercase tracking-wide text-cyan-300">
        Dev — /athlete/programme server render
      </p>
      <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
        <Row label="Page route" value="/athlete/programme" />
        <Row label="Server variant" value={variant} />
        <Row label="Layout trusts athlete" value={layoutTrustsAthlete ? "yes" : "no"} />
        <Row
          label="Recovered via layout"
          value={serverVariantFailed && layoutTrustsAthlete ? "yes" : "no"}
        />
        <Row label="Auth user email" value={debug.authUserEmail ?? "—"} />
        <Row label="Auth user id" value={debug.authUserId ?? "—"} />
        <Row label="Linked athlete id" value={debug.linkedAthleteId ?? "—"} />
        <Row label="Programme published (server)" value={debug.programmePublished ? "yes" : "no"} />
        <Row label="Published week count" value={String(debug.publishedWeekCount)} />
        <Row label="Link failure reason" value={debug.linkFailureReason ?? "—"} />
      </dl>
    </div>
  );
}

export function ProgrammePageResolveNotice({
  variant,
  debug,
}: {
  variant: "no-session" | "not-linked";
  debug: ProgrammePageServerDebug;
}) {
  const title =
    variant === "no-session"
      ? "Could not verify sign-in on programme page"
      : "Athlete profile not linked";

  const copy =
    variant === "no-session"
      ? "The portal layout did not confirm your athlete session for this page load. Reload or sign in again."
      : `Your sign-in is active but this page could not resolve a linked Hyrox athlete (${debug.linkFailureReason ?? "unknown"}).`;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="mt-3 text-sm text-zinc-400">{copy}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/athlete/dashboard"
          className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-400"
        >
          Back to dashboard
        </Link>
        {variant === "no-session" ? (
          <Link
            href="/athlete/login?next=/athlete/programme"
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black"
          >
            Sign in
          </Link>
        ) : (
          <Link
            href="/athlete/onboarding"
            className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-400"
          >
            Onboarding status
          </Link>
        )}
      </div>
      <ProgrammePageServerDebugPanel debug={debug} variant={variant} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-cyan-400/80">{label}</dt>
      <dd className="font-mono text-[11px] text-white/90">{value}</dd>
    </div>
  );
}
