import Link from "next/link";
import type { VerifyOtpAttachDebug } from "@/app/lib/supabase/verifyOtpAttachDebug";

export const dynamic = "force-dynamic";

function decodeDebugPayload(encoded: string | null): VerifyOtpAttachDebug | null {
  if (!encoded?.trim()) return null;
  try {
    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as VerifyOtpAttachDebug;
  } catch {
    return null;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-800 py-2 sm:flex-row sm:justify-between">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-mono text-zinc-100 break-all sm:max-w-[65%] sm:text-right">{value}</dd>
    </div>
  );
}

export default async function VerifyOtpCookieDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; next?: string }>;
}) {
  const params = await searchParams;
  const debug = decodeDebugPayload(params.d ?? null);
  const next = params.next?.trim() || "/athlete/dashboard";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-red-300">OTP login — session cookies refused</h1>
        <p className="mt-2 text-sm text-zinc-400">
          OTP verified with Supabase, but the redirect response did not include usable{" "}
          <span className="font-mono">sb-*-auth-token</span> session cookies. You were not sent to
          the dashboard.
        </p>

        {!debug ? (
          <p className="mt-4 text-amber-200">No debug payload in URL. Try logging in again.</p>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm">
              <p className="font-semibold text-red-200">Refuse reason</p>
              <p className="mt-1 font-mono text-red-100/90">{debug.refuseReason ?? "—"}</p>
            </div>

            <dl className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm">
              <Row label="data.session exists" value={debug.dataSessionExists ? "yes" : "no"} />
              <Row label="accessTokenLength" value={String(debug.accessTokenLength)} />
              <Row label="refreshTokenLength" value={String(debug.refreshTokenLength)} />
              <Row label="encodedSessionLength" value={String(debug.encodedSessionLength)} />
              <Row label="chunkSize" value={String(debug.chunkSize)} />
              <Row
                label="cookiesBuilt names"
                value={debug.cookiesBuiltNames.join(", ") || "—"}
              />
              <Row
                label="cookiesBuilt value lengths"
                value={debug.cookiesBuiltValueLengths.join(", ") || "—"}
              />
              <Row
                label="cookiesBuilt uses chunks"
                value={debug.cookiesBuiltUsesChunks ? "yes" : "no"}
              />
              <Row
                label="cookiesBuilt total auth chars"
                value={String(debug.cookiesBuiltTotalAuthChars)}
              />
              <Row
                label="response Set-Cookie names"
                value={debug.responseSetCookieNames.join(", ") || "—"}
              />
              <Row
                label="response Set-Cookie value lengths"
                value={debug.responseSetCookieValueLengths.join(", ") || "—"}
              />
              <Row
                label="response delete flags"
                value={debug.responseSetCookieDeleteFlags.map((f) => (f ? "del" : "set")).join(", ") || "—"}
              />
              <Row label="has h365_auth_probe" value={debug.hasH365AuthProbe ? "yes" : "no"} />
              <Row label="has main auth-token" value={debug.hasMainAuthToken ? "yes" : "no"} />
              <Row label="has auth-token.0" value={debug.hasAuthTokenChunk0 ? "yes" : "no"} />
              <Row
                label="total auth chunk value length"
                value={String(debug.totalAuthChunkValueLength)}
              />
              <Row
                label="main auth largest value length"
                value={String(debug.mainAuthCookieLargestValueLength)}
              />
              <Row
                label="any cookie over 3800 chars"
                value={debug.anyCookieOver3800Chars ? "yes" : "no"}
              />
              <Row label="any empty auth cookie" value={debug.anyEmptyAuthCookie ? "yes" : "no"} />
              <Row
                label="final redirect Set-Cookie count"
                value={String(debug.finalRedirectSetCookieCount)}
              />
              <Row label="session auth attached" value={debug.sessionAuthAttached ? "yes" : "no"} />
            </dl>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/athlete/login?next=${encodeURIComponent(next)}`}
            className="rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black"
          >
            Try login again
          </Link>
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
