import Link from "next/link";
import {
  probeHyroxPortalAuth,
  resolveHyroxAthletePortalSnapshot,
} from "@/app/lib/hyroxAthletePortalSnapshot";

export const dynamic = "force-dynamic";

export default async function AthleteAuthDebugPage() {
  const { auth, user } = await probeHyroxPortalAuth("/athlete/auth-debug");
  const snapshot = user
    ? await resolveHyroxAthletePortalSnapshot({
        routePath: "/athlete/auth-debug",
        loadProgramme: true,
      })
    : null;

  const authCookieSummary =
    auth.authCookieNames.length > 0
      ? auth.authCookieNames
          .map((name, i) => `${name} (${auth.authCookieValueLengths[i] ?? 0} B)`)
          .join(", ")
      : "—";

  const rows: { label: string; value: string }[] = [
    { label: "Auth cookies present", value: auth.authCookiesPresent ? "yes" : "no" },
    {
      label: "Valid session cookies",
      value: auth.validSessionCookiesPresent ? "yes" : "no",
    },
    { label: "Auth cookie names (sizes)", value: authCookieSummary },
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

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold">Athlete auth debug</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Temporary check that Supabase session cookies are stored and readable by the server.
        </p>

        <dl className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-zinc-400">{row.label}</dt>
              <dd className="font-mono text-left text-zinc-100 sm:text-right sm:max-w-[60%] break-all">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
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
          <Link
            href="/athlete/programme"
            className="rounded-full border border-zinc-600 px-4 py-2 text-zinc-200"
          >
            Programme
          </Link>
        </div>
      </div>
    </div>
  );
}
