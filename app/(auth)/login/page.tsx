"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildEmailRedirectTo } from "@/app/lib/authRedirectUrl";
import {
  CALLBACK_ERROR_HEADLINE,
  EMAIL_CODE_SUCCESS_COPY,
  MAGIC_LINK_HELP_COPY,
  MAGIC_LINK_SUCCESS_COPY,
  mapCallbackAuthError,
  mapSignInOtpError,
  mapSignInOtpThrownError,
  OTP_ERROR_HEADLINE_DEFAULT,
} from "@/app/lib/authLoginErrors";
import { createClient } from "@/app/lib/supabase/client";

const OTP_TIMEOUT_MS = 30_000;

type LoginMode = "magic_link" | "email_code";
type LoginBanner =
  | { kind: "callback"; headline: string; detail: string }
  | { kind: "otp"; headline: string; detail: string };

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const urlReason = searchParams.get("reason");

  const [mode, setMode] = useState<LoginMode>("magic_link");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [banner, setBanner] = useState<LoginBanner | null>(() => {
    if (urlError === "auth") {
      return {
        kind: "callback",
        headline: CALLBACK_ERROR_HEADLINE,
        detail: mapCallbackAuthError(urlReason),
      };
    }
    return null;
  });

  async function sendOtpEmail(trimmed: string) {
    const supabase = createClient();
    const options: {
      emailRedirectTo?: string;
      shouldCreateUser?: boolean;
    } = { shouldCreateUser: true };

    if (mode === "magic_link") {
      options.emailRedirectTo = buildEmailRedirectTo(next);
    }

    return withTimeout(
      supabase.auth.signInWithOtp({
        email: trimmed,
        options,
      }),
      OTP_TIMEOUT_MS,
      "Request timed out. Check your connection and try again."
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setBanner(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setSubmitting(false);
      setBanner({
        kind: "otp",
        headline: OTP_ERROR_HEADLINE_DEFAULT,
        detail: "Enter a valid email address.",
      });
      return;
    }

    try {
      const { error } = await sendOtpEmail(trimmed);
      if (error) {
        console.error("[login] signInWithOtp error object", error);
        const mapped = mapSignInOtpError(error);
        setBanner({
          kind: "otp",
          headline: mapped.headline,
          detail: mapped.detail,
        });
        return;
      }
      setSent(true);
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      console.error("[login] signInWithOtp failed (thrown)", unknown);
      const mapped = mapSignInOtpThrownError(err);
      setBanner({
        kind: "otp",
        headline: mapped.headline,
        detail: mapped.detail,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const token = emailCode.trim().replace(/\s/g, "");
    if (!trimmedEmail || token.length < 6) {
      setBanner({
        kind: "otp",
        headline: "Enter your code",
        detail: "Use the 6-digit code from your email (same message as the magic link).",
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const supabase = createClient();
      const { error } = await withTimeout(
        supabase.auth.verifyOtp({
          email: trimmedEmail,
          token,
          type: "email",
        }),
        OTP_TIMEOUT_MS,
        "Verification timed out. Try again."
      );

      if (error) {
        console.error("[login] verifyOtp error", error);
        setBanner({
          kind: "otp",
          headline: "Code didn’t work",
          detail:
            error.message?.includes("expired") || error.message?.includes("invalid")
              ? "That code expired or was already used. Request a new email and use the latest code."
              : error.message || "Check the code and try again.",
        });
        return;
      }

      const dest = next.startsWith("/") ? next : "/dashboard";
      router.push(dest);
      router.refresh();
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      setBanner({
        kind: "otp",
        headline: "Code didn’t work",
        detail: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-4 flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("magic_link");
            setSent(false);
            setBanner(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
            mode === "magic_link"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("email_code");
            setSent(false);
            setBanner(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
            mode === "email_code"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Email code
        </button>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="space-y-3 text-center text-sm leading-relaxed text-zinc-300">
            <p>{mode === "magic_link" ? MAGIC_LINK_SUCCESS_COPY : EMAIL_CODE_SUCCESS_COPY}</p>
            <p className="text-xs text-zinc-500">{MAGIC_LINK_HELP_COPY}</p>
          </div>
          {(mode === "email_code" || mode === "magic_link") && (
            <form onSubmit={onVerifyCode} className="space-y-3 border-t border-zinc-800 pt-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                6-digit code from email
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-zinc-600 focus:border-[#F4D23C]/60 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/40"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
              >
                {submitting ? "Verifying…" : "Sign in with code"}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            Use a different email
          </button>
        </div>
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
            <div className="mt-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="font-medium text-zinc-300">Paid member?</span> Use the exact same
                email you used to join Whop so your dashboard access unlocks automatically.
              </p>
            </div>
            {mode === "email_code" ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                We&apos;ll email a one-time code. Email scanners can&apos;t consume codes the way
                they sometimes break magic links.
              </p>
            ) : null}
          </div>

          {banner ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-3 text-sm">
              {banner.kind === "otp" ? (
                <>
                  <p className="font-medium text-red-200">{banner.headline}</p>
                  {banner.detail ? (
                    <p className="mt-2 text-xs leading-relaxed text-red-200/80">{banner.detail}</p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="font-medium text-red-200">{banner.headline}</p>
                  <p className="mt-2 text-sm leading-relaxed text-red-200/95">{banner.detail}</p>
                </>
              )}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c235] disabled:opacity-60"
          >
            {submitting
              ? "Sending…"
              : mode === "magic_link"
                ? "Email me a link"
                : "Email me a code"}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">
            {MAGIC_LINK_HELP_COPY}
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
          <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Magic link or 6-digit code — no password.
          </p>
        </div>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Free training week?{" "}
          <Link href="/free-week" className="text-[#F4D23C] hover:underline">
            Get your blueprint
          </Link>
        </p>
      </div>
    </div>
  );
}
