"use client";

import Link from "next/link";
import type { ProgrammePageRenderGateResult } from "@/app/lib/hyroxAthleteProgrammePageGate";

export type { ProgrammePageRenderGateResult };
import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";

function DebugRows({
  debug,
  variant,
  layoutServerAuthConfirmed,
  gate,
}: {
  debug: ProgrammePageServerDebug;
  variant: string;
  layoutServerAuthConfirmed?: boolean;
  gate?: ProgrammePageRenderGateResult;
}) {
  return (
    <dl className="mt-3 grid gap-1.5 text-left sm:grid-cols-2">
      <Row label="Current URL" value={debug.currentUrl || "/athlete/programme"} />
      <Row label="Page route" value="/athlete/programme" />
      <Row label="Server variant" value={variant} />
      <Row label="Auth cookies present" value={debug.authCookiesPresent ? "yes" : "no"} />
      <Row label="Raw cookie header present" value={debug.rawCookieHeaderPresent ? "yes" : "no"} />
      <Row
        label="Middleware x-hyrox-cookie-present"
        value={debug.middlewareCookiePresent ? "yes" : "no"}
      />
      <Row
        label="Middleware x-hyrox-user-present"
        value={debug.middlewareUserPresent ? "yes" : "no"}
      />
      <Row
        label="Middleware internal nav"
        value={debug.middlewareInternalNav ? "yes" : "no"}
      />
      <Row label="getSession succeeded" value={debug.getSessionSucceeded ? "yes" : "no"} />
      <Row label="getUser succeeded" value={debug.getUserSucceeded ? "yes" : "no"} />
      <Row
        label="getUser after retry succeeded"
        value={debug.getUserAfterRetrySucceeded ? "yes" : "no"}
      />
      <Row label="User source" value={debug.userSource} />
      <Row label="Session user id" value={debug.sessionUserId ?? "—"} />
      <Row label="Auth user id" value={debug.authUserId ?? "—"} />
      <Row label="Auth user email" value={debug.authUserEmail ?? "—"} />
      <Row label="Middleware auth user id" value={debug.middlewareAuthUserId ?? "—"} />
      <Row label="Middleware auth email" value={debug.middlewareAuthEmail ?? "—"} />
      <Row
        label="layoutServerAuthConfirmed"
        value={layoutServerAuthConfirmed ? "yes" : "no"}
      />
      <Row label="Resolved athlete id" value={debug.linkedAthleteId ?? "—"} />
      <Row
        label="Resolved email"
        value={debug.linkedAthleteEmail ?? debug.authUserEmail ?? "—"}
      />
      <Row
        label="Programme published"
        value={debug.programmePublished ? "yes" : "no"}
      />
      <Row
        label="Programme weeks count"
        value={String(gate?.programmeWeeksCount ?? debug.publishedWeekCount)}
      />
      <Row
        label="Programme sessions count"
        value={String(gate?.programmeSessionsCount ?? debug.publishedSessionsCount)}
      />
      <Row label="Final render decision" value={gate?.decision ?? debug.finalRenderDecision} />
      <Row label="Block / render reason" value={gate?.reason ?? debug.renderReason} />
      <Row label="Link failure reason" value={debug.linkFailureReason ?? "—"} />
      <Row
        label="Would redirect to login"
        value={debug.wouldHaveRedirectedToLogin ? "yes" : "no"}
      />
    </dl>
  );
}

export function ProgrammePageServerDebugPanel({
  debug,
  variant,
  layoutServerAuthConfirmed = false,
  gate,
}: {
  debug: ProgrammePageServerDebug;
  variant: string;
  layoutServerAuthConfirmed?: boolean;
  gate?: ProgrammePageRenderGateResult;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mb-6 rounded-xl border border-cyan-500/35 bg-cyan-950/25 p-4 text-xs text-cyan-100/90">
      <p className="font-bold uppercase tracking-wide text-cyan-300">
        Dev — /athlete/programme server render
      </p>
      <DebugRows
        debug={debug}
        variant={variant}
        layoutServerAuthConfirmed={layoutServerAuthConfirmed}
        gate={gate}
      />
    </div>
  );
}

export function ProgrammePageResolveNotice({
  variant,
  debug,
  gate,
}: {
  variant: "no-session" | "not-linked";
  debug: ProgrammePageServerDebug;
  gate?: ProgrammePageRenderGateResult;
}) {
  const title =
    variant === "no-session"
      ? "Could not verify sign-in on programme page"
      : "Athlete profile not linked";

  const copy =
    variant === "no-session"
      ? gate?.reason ??
        "The programme page could not resolve your Supabase session. Reload or sign in again."
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
      <div className="mt-8 rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4 text-left text-xs text-zinc-300">
        <p className="font-semibold uppercase tracking-wide text-zinc-400">
          Programme page resolver debug
        </p>
        <DebugRows debug={debug} variant={variant} layoutServerAuthConfirmed={false} gate={gate} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-cyan-400/80">{label}</dt>
      <dd className="font-mono text-[11px] text-cyan-50/95 break-all">{value}</dd>
    </div>
  );
}
