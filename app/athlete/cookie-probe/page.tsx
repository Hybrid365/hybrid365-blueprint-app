import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AthleteCookieProbePage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl text-sm">
        <h1 className="text-xl font-semibold">Cookie storage probe</h1>
        <p className="mt-2 text-zinc-400">
          Use this to see whether the browser stores cookies from this app at all, separate from
          Supabase session cookies.
        </p>

        <ol className="mt-6 list-decimal space-y-3 pl-5 text-zinc-200">
          <li>
            Open{" "}
            <a
              href="/api/auth/cookie-probe"
              className="font-mono text-yellow-300 underline"
              target="_blank"
              rel="noreferrer"
            >
              /api/auth/cookie-probe
            </a>{" "}
            in this tab (sets <span className="font-mono">h365_probe=ok</span>).
          </li>
          <li>
            Open{" "}
            <Link href="/athlete/auth-debug" className="font-mono text-yellow-300 underline">
              /athlete/auth-debug
            </Link>{" "}
            and check <span className="font-mono">h365_probe present</span>.
          </li>
          <li>
            Optional: open{" "}
            <a
              href="/api/auth/verify-otp?probeOnly=1"
              className="font-mono text-yellow-300 underline"
              target="_blank"
              rel="noreferrer"
            >
              /api/auth/verify-otp?probeOnly=1
            </a>{" "}
            (sets <span className="font-mono">h365_auth_probe</span> only).
          </li>
          <li>
            Log in via{" "}
            <Link href="/athlete/login?next=/athlete/auth-debug" className="underline">
              /athlete/login
            </Link>
            , complete OTP (native form POST + redirect), then read auth-debug again.
          </li>
        </ol>

        <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 text-zinc-300">
          <p className="font-semibold text-zinc-100">How to read results</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="font-mono">h365_probe</span> missing — browser not accepting app
              cookies (Secure / SameSite / domain).
            </li>
            <li>
              <span className="font-mono">h365_auth_probe</span> yes, sb auth-token missing — verify
              response stored the small probe but rejected Supabase cookie.
            </li>
            <li>
              Both probes missing after OTP — verify-otp Set-Cookie not stored at all.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/api/auth/cookie-probe"
            className="rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black"
          >
            Run API probe
          </a>
          <Link
            href="/athlete/auth-debug"
            className="rounded-full border border-zinc-600 px-4 py-2 text-zinc-200"
          >
            Auth debug
          </Link>
        </div>
      </div>
    </div>
  );
}
