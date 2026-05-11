"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

const SUCCESS_COPY = "Check your email for the sign-in link.";
const OTP_ERROR_HEADLINE = "We couldn’t send the sign-in link. Please try again.";
const OTP_TIMEOUT_MS = 30_000;

type LoginBanner =
  | { kind: "callback"; detail: string }
  | { kind: "otp"; headline: string; detail: string };

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [banner, setBanner] = useState<LoginBanner | null>(
    urlError === "auth"
      ? {
          kind: "callback",
          detail:
            "That sign-in link expired or was already used. Request a fresh link below.",
        }
      : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSent(false);
    setBanner(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setSubmitting(false);
      setBanner({
        kind: "otp",
        headline: OTP_ERROR_HEADLINE,
        detail: "Enter a valid email address.",
      });
      return;
    }

    // Must match Supabase redirect allowlist: `${origin}/auth/callback` (+ optional `next` for post-login routing).
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/dashboard")}`;

    try {
      const supabase = createClient();
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo,
          },
        }),
        OTP_TIMEOUT_MS,
        "Request timed out. Check your connection and try again."
      );

      if (error) {
        console.error("[login] signInWithOtp error object", error);
        setBanner({
          kind: "otp",
          headline: OTP_ERROR_HEADLINE,
          detail: error.message || JSON.stringify(error),
        });
        return;
      }

      setSent(true);
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      console.error("[login] signInWithOtp failed (thrown)", unknown);
      setBanner({
        kind: "otp",
        headline: OTP_ERROR_HEADLINE,
        detail: err.message || "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {sent ? (
        <p className="text-center text-sm leading-relaxed text-zinc-300">{SUCCESS_COPY}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#F4D23C]/60 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/40"
              placeholder="you@example.com"
              disabled={submitting}
            />
          </div>

          {banner ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-3 text-sm">
              {banner.kind === "otp" ? (
                <>
                  <p className="font-medium text-red-200">{banner.headline}</p>
                  {banner.detail ? (
                    <p
                      className={`mt-2 text-xs leading-relaxed text-red-200/80 ${process.env.NODE_ENV === "development" ? "font-mono" : ""}`}
                    >
                      {banner.detail}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm leading-relaxed text-red-200/95">{banner.detail}</p>
              )}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c235] disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Email me a link"}
          </button>

          <p className="text-center text-xs leading-relaxed text-zinc-500">
            Use the latest email link. Sign-in links can expire or be invalidated if you request a new one.
          </p>
        </form>
      )}
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-center text-sm text-zinc-500">Loading…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-[#F4D23C]" />
            Hybrid365 Member
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            We&apos;ll email you a magic link — no password.
          </p>
        </div>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Free training week?{" "}
          <Link
            href="/free-week"
            className="text-[#F4D23C] hover:underline"
          >
            Get your blueprint
          </Link>
        </p>
      </div>
    </div>
  );
}
