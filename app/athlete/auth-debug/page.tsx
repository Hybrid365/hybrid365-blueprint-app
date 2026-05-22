import Link from "next/link";
import { formatAuthRelatedCookieEntries } from "@/app/lib/supabase/cookieProbe";
import {
  probeHyroxPortalAuth,
  resolveHyroxAthletePortalSnapshot,
} from "@/app/lib/hyroxAthletePortalSnapshot";

export const dynamic = "force-dynamic";

function formatAuthCookies(summaries: {
  name: string;
  cookiesStoreLength: number;
  rawHeaderLength: number;
  mergedLength: number;
  chosenSource: string;
  startsWithBase64: boolean;
}[]): string {
  if (summaries.length === 0) return "—";
  return summaries
    .map(
      (c) =>
        `${c.name}: merged ${c.mergedLength} B (${c.chosenSource}, store ${c.cookiesStoreLength} B, header ${c.rawHeaderLength} B${c.startsWithBase64 ? ", base64" : ""})`
    )
    .join("; ");
}

export default async function AthleteAuthDebugPage() {
  const { auth, user } = await probeHyroxPortalAuth("/athlete/auth-debug");
  const snapshot = user
    ? await resolveHyroxAthletePortalSnapshot({
        routePath: "/athlete/auth-debug",
        loadProgramme: true,
      })
    : null;

  const merge = auth.cookieMerge;
  const mainAuth = auth.mainAuth;
  const probe = auth.storageProbe;

  const rows: { label: string; value: string }[] = [
    { label: "Storage interpretation", value: probe.storageInterpretation },
    { label: "h365_probe present", value: probe.h365ProbePresent ? "yes" : "no" },
    { label: "h365_probe value", value: probe.h365ProbeValue ?? "—" },
    {
      label: "h365_auth_probe present",
      value: probe.h365AuthProbePresent ? "yes" : "no",
    },
    { label: "h365_auth_probe value", value: probe.h365AuthProbeValue ?? "—" },
    { label: "Auth cookies present", value: auth.authCookiesPresent ? "yes" : "no" },
    {
      label: "Raw Cookie header names",
      value:
        mainAuth.rawCookieHeaderNames.length > 0
          ? mainAuth.rawCookieHeaderNames.join(", ")
          : "—",
    },
    {
      label: "Raw Cookie header chars",
      value: String(merge.rawHeaderChars),
    },
    {
      label: "Main auth-token exists",
      value: mainAuth.mainAuthTokenExists ? "yes" : "no",
    },
    {
      label: "Main auth-token value length",
      value: `${mainAuth.mainAuthTokenValueLength} B`,
    },
    {
      label: "Code-verifier present",
      value: mainAuth.codeVerifierCookiePresent ? "yes" : "no",
    },
    {
      label: "Auth-related cookies (names / lengths)",
      value: formatAuthRelatedCookieEntries(probe.authRelatedCookieEntries),
    },
    {
      label: "Empty main auth-token duplicate",
      value: mainAuth.emptyMainAuthDuplicateDetected ? "yes" : "no",
    },
    {
      label: "Code-verifier cookie names",
      value:
        mainAuth.codeVerifierCookieNames.length > 0
          ? mainAuth.codeVerifierCookieNames.join(", ")
          : "—",
    },
    { label: "Valid session cookies", value: auth.validSessionCookiesPresent ? "yes" : "no" },
    { label: "Duplicate cookie names", value: merge.duplicateNamesDetected ? "yes" : "no" },
    {
      label: "Primary auth-token source",
      value: merge.primaryAuthTokenChosenSource,
    },
    {
      label: "cookies() auth total chars",
      value: String(merge.cookiesStoreAuthTotalChars),
    },
    {
      label: "Raw header auth total chars",
      value: String(merge.rawHeaderAuthTotalChars),
    },
    {
      label: "Merged auth total chars",
      value: String(merge.mergedAuthTotalChars),
    },
    {
      label: "Auth cookies (sizes / source)",
      value: formatAuthCookies(auth.authCookieSummaries),
    },
    { label: "Raw cookie header present", value: auth.rawCookieHeaderPresent ? "yes" : "no" },
    { label: "getSession succeeded", value: auth.getSessionSucceeded ? "yes" : "no" },
    { label: "getSession error", value: auth.getSessionError ?? "—" },
    { label: "getUser succeeded", value: auth.getUserSucceeded ? "yes" : "no" },
    { label: "getUser error", value: auth.getUserError ?? "—" },
    { label: "getUser after retry succeeded", value: auth.getUserAfterRetrySucceeded ? "yes" : "no" },
    { label: "User source", value: auth.userSource },
    { label: "Auth email", value: auth.authUserEmail ?? "—" },
    { label: "Resolved athlete id", value: snapshot?.athlete?.id ?? "—" },
    {
      label: "Programme weeks count",
      value: String(snapshot?.publishedWeekCount ?? 0),
    },
    {
      label: "Programme sessions count",
      value: String(snapshot?.publishedSessionsCount ?? 0),
    },
    {
      label: "Middleware x-hyrox-cookie-present",
      value: auth.middlewareCookiePresent ? "yes" : "no",
    },
    {
      label: "Middleware x-hyrox-user-present",
      value: auth.middlewareUserPresent ? "yes" : "no",
    },
  ];

  if (merge.duplicateNames.length > 0) {
    rows.splice(12, 0, {
      label: "Duplicate names",
      value: merge.duplicateNames.join(", "),
    });
  }

  const noCookiesAtAll =
    merge.rawHeaderChars === 0 &&
    !probe.h365ProbePresent &&
    !probe.h365AuthProbePresent &&
    !mainAuth.mainAuthTokenExists;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold">Athlete auth debug</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Compare <span className="font-mono">h365_probe</span> (from{" "}
          <span className="font-mono">/api/auth/cookie-probe</span>) and{" "}
          <span className="font-mono">h365_auth_probe</span> (from verify-otp) with the Supabase{" "}
          <span className="font-mono">sb-*-auth-token</span> cookie.
        </p>

        {noCookiesAtAll ? (
          <div
            className="mt-4 rounded-xl border border-red-500/45 bg-red-950/35 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            <p className="font-semibold text-red-200">No cookies reached server</p>
            <p className="mt-1 text-red-100/90">
              Login did not persist session. Run the isolated probe: visit{" "}
              <span className="font-mono">/api/auth/cookie-probe</span> then reload this page. If{" "}
              <span className="font-mono">h365_probe</span> is still missing, the browser is not
              storing cookies from this app (Secure / SameSite / domain).
            </p>
          </div>
        ) : null}

        {probe.h365AuthProbePresent && !mainAuth.mainAuthTokenExists ? (
          <div
            className="mt-4 rounded-xl border border-amber-500/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            <p className="font-semibold text-amber-200">Probe OK, Supabase session missing</p>
            <p className="mt-1 text-amber-100/90">
              <span className="font-mono">h365_auth_probe</span> reached the server but{" "}
              <span className="font-mono">{mainAuth.mainAuthTokenName}</span> did not. The browser
              accepts small app cookies but rejected or dropped the Supabase auth cookie.
            </p>
          </div>
        ) : null}

        {mainAuth.mainAuthTokenExists && mainAuth.mainAuthTokenValueLength === 0 ? (
          <div
            className="mt-4 rounded-xl border border-amber-500/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            <p className="font-semibold text-amber-200">Main auth-token cookie is empty (0 B)</p>
            <p className="mt-1 text-amber-100/90">
              The browser sent{" "}
              <span className="font-mono">{mainAuth.mainAuthTokenName}</span> but with no session
              value. Check verify-otp for duplicate or empty main auth-token Set-Cookie headers.
            </p>
          </div>
        ) : null}

        <dl className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="shrink-0 text-zinc-400">{row.label}</dt>
              <dd className="font-mono text-left text-zinc-100 sm:max-w-[65%] break-all sm:text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/athlete/cookie-probe"
            className="rounded-full border border-zinc-600 px-4 py-2 text-zinc-200"
          >
            Cookie probe guide
          </Link>
          <Link
            href="/athlete/login?next=/athlete/auth-debug"
            className="rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black"
          >
            Athlete login
          </Link>
          <Link
            href="/athlete/dashboard"
            className="rounded-full border border-zinc-600 px-4 py-2 text-zinc-200"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
