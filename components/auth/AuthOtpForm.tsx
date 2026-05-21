"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildAthleteEmailRedirectTo, buildEmailRedirectTo } from "@/app/lib/authRedirectUrl";
import {
  ATHLETE_EMAIL_CODE_SUCCESS_COPY,
  CALLBACK_ERROR_HEADLINE,
  EMAIL_CODE_SUCCESS_COPY,
  LOGIN_CODE_SENT_COPY,
  LOGIN_RATE_LIMIT_COPY,
  MAGIC_LINK_HELP_COPY,
  MAGIC_LINK_SUCCESS_COPY,
  NO_PAID_ATHLETE_AUTO_LINK_COPY,
  mapCallbackAuthError,
  mapSignInOtpError,
  mapSignInOtpThrownError,
  OTP_ERROR_HEADLINE_DEFAULT,
} from "@/app/lib/authLoginErrors";
import { createClient } from "@/app/lib/supabase/client";

const OTP_TIMEOUT_MS = 30_000;
const SEND_CODE_COOLDOWN_SEC = 60;

type LoginMode = "magic_link" | "email_code";
type LoginBanner =
  | { kind: "callback"; headline: string; detail: string }
  | { kind: "otp"; headline: string; detail: string }
  | { kind: "info"; headline: string; detail: string };

export type AuthOtpFormProps = {
  sanitizeNext: (next: string | null) => string;
  variant: "community" | "athlete";
  magicLinkSubmitLabel: string;
  emailCodeSubmitLabel: string;
  verifyCodeLabel?: string;
  guidance?: ReactNode;
  emailCodeHint?: ReactNode;
  footerHelp?: string;
  showModeTabs?: boolean;
  defaultMode?: LoginMode;
};

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function athleteAutoLinkAfterLogin(): Promise<{
  linked: boolean;
  message: string | null;
}> {
  try {
    const res = await fetch("/api/hyrox/athlete/auto-link", { method: "POST" });
    const data = (await res.json()) as {
      linked?: boolean;
      message?: string;
      reason?: string;
      debug?: Record<string, unknown>;
    };
    if (!res.ok) {
      return { linked: false, message: null };
    }
    if (data.linked) {
      return { linked: true, message: null };
    }
    let message: string | null = null;
    if (data.reason === "NO_PAID_ATHLETE_FOUND") {
      message = data.message ?? NO_PAID_ATHLETE_AUTO_LINK_COPY;
    } else if (data.reason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
      message =
        data.message ??
        "Your email matches a paid athlete profile linked to a different sign-in account. Ask your coach to relink, or sign out and use your original login.";
    } else if (data.message) {
      message = data.message;
    }
    if (message) {
      try {
        sessionStorage.setItem("hyrox_auto_link_notice", message);
        if (process.env.NODE_ENV === "development" && data.debug) {
          sessionStorage.setItem("hyrox_auto_link_debug", JSON.stringify(data.debug));
        }
      } catch {
        /* ignore */
      }
    }
    return { linked: false, message };
  } catch {
    return { linked: false, message: null };
  }
}

function CommunityEmailCodeLogin({
  sanitizeNext,
  guidance,
  emailCodeSubmitLabel,
  verifyCodeLabel,
  magicLinkSubmitLabel,
}: {
  sanitizeNext: AuthOtpFormProps["sanitizeNext"];
  guidance?: ReactNode;
  emailCodeSubmitLabel: string;
  verifyCodeLabel: string;
  magicLinkSubmitLabel: string;
}) {
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const urlError = searchParams.get("error");
  const urlReason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
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

  const cooldownActive = cooldownUntil > Date.now();
  const cooldownSecondsLeft = cooldownActive
    ? Math.ceil((cooldownUntil - Date.now()) / 1000)
    : 0;

  useEffect(() => {
    if (!cooldownActive) return;
    const t = window.setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(0);
      }
    }, 500);
    return () => window.clearInterval(t);
  }, [cooldownActive, cooldownUntil]);

  async function sendLoginCode() {
    const trimmed = email.trim();
    if (!trimmed) {
      setBanner({
        kind: "otp",
        headline: OTP_ERROR_HEADLINE_DEFAULT,
        detail: "Enter a valid email address.",
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const supabase = createClient();
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: trimmed,
          options: { shouldCreateUser: true },
        }),
        OTP_TIMEOUT_MS,
        "Request timed out. Check your connection and try again."
      );
      if (error) {
        const mapped = mapSignInOtpError(error);
        const isRateLimit =
          mapped.detail === LOGIN_RATE_LIMIT_COPY ||
          mapped.headline.toLowerCase().includes("too many");
        setBanner({
          kind: "otp",
          headline: isRateLimit ? "Too many login attempts" : mapped.headline,
          detail: isRateLimit ? LOGIN_RATE_LIMIT_COPY : mapped.detail,
        });
        return;
      }
      setCodeRequested(true);
      setCooldownUntil(Date.now() + SEND_CODE_COOLDOWN_SEC * 1000);
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      const mapped = mapSignInOtpThrownError(err);
      setBanner({ kind: "otp", headline: mapped.headline, detail: mapped.detail });
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyLoginCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const token = emailCode.trim().replace(/\s/g, "");
    if (!trimmedEmail || token.length < 6) {
      setBanner({
        kind: "otp",
        headline: "Enter your code",
        detail: "Enter the 6-digit code from your email.",
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const res = await withTimeout(
        fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: trimmedEmail, token, next }),
        }),
        OTP_TIMEOUT_MS,
        "Verification timed out. Try again."
      );

      const data = (await res.json()) as { success?: boolean; error?: string; redirectTo?: string };

      if (!res.ok || !data.success) {
        setBanner({
          kind: "otp",
          headline: "Code didn’t work",
          detail: data.error ?? "Check the code and try again.",
        });
        return;
      }

      const destination = data.redirectTo ?? next;
      window.location.assign(destination);
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      setBanner({ kind: "otp", headline: "Code didn’t work", detail: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendMagicLink() {
    const trimmed = email.trim();
    if (!trimmed) {
      setBanner({
        kind: "otp",
        headline: OTP_ERROR_HEADLINE_DEFAULT,
        detail: "Enter a valid email address.",
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const supabase = createClient();
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: buildEmailRedirectTo(next),
          },
        }),
        OTP_TIMEOUT_MS,
        "Request timed out. Check your connection and try again."
      );
      if (error) {
        const mapped = mapSignInOtpError(error);
        setBanner({ kind: "otp", headline: mapped.headline, detail: mapped.detail });
        return;
      }
      setMagicSent(true);
    } catch (unknown) {
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
      const mapped = mapSignInOtpThrownError(err);
      setBanner({ kind: "otp", headline: mapped.headline, detail: mapped.detail });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <form onSubmit={verifyLoginCode} className="space-y-4">
        <div>
          <label
            htmlFor="community-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Email
          </label>
          <input
            id="community-email"
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
          {guidance}
        </div>

        <div>
          <label
            htmlFor="community-code"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Login code
          </label>
          <input
            id="community-code"
            name="code"
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
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {codeRequested ? LOGIN_CODE_SENT_COPY : "Request a code below, then enter it here."}
          </p>
        </div>

        {banner ? (
          <div
            className={`rounded-xl border px-3 py-3 text-sm ${
              banner.kind === "info"
                ? "border-amber-500/30 bg-amber-950/30"
                : "border-red-500/30 bg-red-950/30"
            }`}
          >
            <p
              className={`font-medium ${
                banner.kind === "info" ? "text-amber-200" : "text-red-200"
              }`}
            >
              {banner.headline}
            </p>
            {banner.detail ? (
              <p
                className={`mt-2 text-xs leading-relaxed ${
                  banner.kind === "info" ? "text-amber-200/80" : "text-red-200/80"
                }`}
              >
                {banner.detail}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={submitting || cooldownActive}
          onClick={() => void sendLoginCode()}
          className="w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c235] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Sending…"
            : cooldownActive
              ? `Send login code (${cooldownSecondsLeft}s)`
              : emailCodeSubmitLabel}
        </button>

        <button
          type="submit"
          disabled={submitting || emailCode.trim().replace(/\s/g, "").length < 6}
          className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Verifying…" : verifyCodeLabel}
        </button>
      </form>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={() => setMagicOpen((o) => !o)}
          className="text-xs font-medium text-zinc-400 hover:text-[#F4D23C]"
        >
          {magicOpen ? "Hide magic link" : "Prefer magic link?"}
        </button>
        {magicOpen ? (
          <div className="mt-3 space-y-3">
            {magicSent ? (
              <p className="text-sm leading-relaxed text-zinc-300">{MAGIC_LINK_SUCCESS_COPY}</p>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void sendMagicLink()}
                className="w-full rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
              >
                {submitting ? "Sending…" : magicLinkSubmitLabel}
              </button>
            )}
            <p className="text-[11px] leading-relaxed text-zinc-500">{MAGIC_LINK_HELP_COPY}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthOtpForm({
  sanitizeNext,
  variant,
  magicLinkSubmitLabel,
  emailCodeSubmitLabel,
  verifyCodeLabel = "Verify code",
  guidance,
  emailCodeHint,
  footerHelp = MAGIC_LINK_HELP_COPY,
  showModeTabs,
  defaultMode,
}: AuthOtpFormProps) {
  if (variant === "community" && defaultMode === "email_code" && showModeTabs === false) {
    return (
      <CommunityEmailCodeLogin
        sanitizeNext={sanitizeNext}
        guidance={guidance}
        emailCodeSubmitLabel={emailCodeSubmitLabel}
        verifyCodeLabel={verifyCodeLabel}
        magicLinkSubmitLabel={magicLinkSubmitLabel}
      />
    );
  }

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const urlError = searchParams.get("error");
  const urlReason = searchParams.get("reason");

  const resolvedShowModeTabs = showModeTabs ?? variant === "community";
  const initialMode: LoginMode =
    defaultMode ?? (variant === "athlete" ? "email_code" : "magic_link");

  const [mode, setMode] = useState<LoginMode>(initialMode);
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

    if (mode === "email_code") {
      return withTimeout(
        supabase.auth.signInWithOtp({
          email: trimmed,
          options: { shouldCreateUser: true },
        }),
        OTP_TIMEOUT_MS,
        "Request timed out. Check your connection and try again."
      );
    }

    return withTimeout(
      supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            variant === "athlete"
              ? buildAthleteEmailRedirectTo(next)
              : buildEmailRedirectTo(next),
        },
      }),
      OTP_TIMEOUT_MS,
      "Request timed out. Check your connection and try again."
    );
  }

  async function finishLogin() {
    if (variant === "athlete") {
      const { message } = await athleteAutoLinkAfterLogin();
      if (message) {
        try {
          sessionStorage.setItem("hyrox_auto_link_notice", message);
        } catch {
          /* ignore */
        }
      }
    }
    router.push(next);
    router.refresh();
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
        console.error(`[${variant} login] signInWithOtp error object`, error);
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
      console.error(`[${variant} login] signInWithOtp failed (thrown)`, unknown);
      const err = unknown instanceof Error ? unknown : new Error(String(unknown));
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
        detail: "Enter the 6-digit code from your email.",
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
        console.error(`[${variant} login] verifyOtp error`, error);
        setBanner({
          kind: "otp",
          headline: "Code didn’t work",
          detail:
            error.message?.includes("expired") || error.message?.includes("invalid")
              ? "That code expired or was already used. Request a new code and use the latest one."
              : error.message || "Check the code and try again.",
        });
        return;
      }

      await finishLogin();
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

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setSent(false);
    setEmailCode("");
    setBanner(null);
  }

  const sentSuccessCopy =
    mode === "magic_link"
      ? MAGIC_LINK_SUCCESS_COPY
      : variant === "athlete"
        ? ATHLETE_EMAIL_CODE_SUCCESS_COPY
        : EMAIL_CODE_SUCCESS_COPY;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {resolvedShowModeTabs ? (
        <div className="mb-4 flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => switchMode("magic_link")}
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
            onClick={() => switchMode("email_code")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
              mode === "email_code"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Email code
          </button>
        </div>
      ) : null}

      {sent ? (
        <div className="space-y-4">
          <div className="space-y-3 text-center text-sm leading-relaxed text-zinc-300">
            <p>{sentSuccessCopy}</p>
            {mode === "email_code" ? (
              <p className="text-xs text-zinc-500">{footerHelp}</p>
            ) : null}
          </div>
          {mode === "email_code" ? (
            <form onSubmit={onVerifyCode} className="space-y-3 border-t border-zinc-800 pt-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                6-digit login code
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
                className="w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black hover:bg-[#e6c235] disabled:opacity-60"
              >
                {submitting ? "Verifying…" : verifyCodeLabel}
              </button>
            </form>
          ) : null}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            Use a different email
          </button>
          {variant === "athlete" ? (
            <button
              type="button"
              onClick={() => switchMode(mode === "email_code" ? "magic_link" : "email_code")}
              className="w-full text-center text-xs text-[#F4D23C]/90 hover:text-[#F4D23C]"
            >
              {mode === "email_code" ? "Use magic link instead" : "Use 6-digit code instead"}
            </button>
          ) : null}
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
            {guidance}
            {mode === "email_code" && emailCodeHint ? (
              <div className="mt-2">{emailCodeHint}</div>
            ) : null}
          </div>

          {banner ? (
            <div
              className={`rounded-xl border px-3 py-3 text-sm ${
                banner.kind === "info"
                  ? "border-amber-500/30 bg-amber-950/30"
                  : "border-red-500/30 bg-red-950/30"
              }`}
            >
              {banner.kind === "otp" || banner.kind === "info" ? (
                <>
                  <p
                    className={`font-medium ${
                      banner.kind === "info" ? "text-amber-200" : "text-red-200"
                    }`}
                  >
                    {banner.headline}
                  </p>
                  {banner.detail ? (
                    <p
                      className={`mt-2 text-xs leading-relaxed ${
                        banner.kind === "info" ? "text-amber-200/80" : "text-red-200/80"
                      }`}
                    >
                      {banner.detail}
                    </p>
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
                ? magicLinkSubmitLabel
                : emailCodeSubmitLabel}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">{footerHelp}</p>

          {variant === "athlete" && mode === "email_code" ? (
            <button
              type="button"
              onClick={() => switchMode("magic_link")}
              className="w-full text-center text-xs text-zinc-500 hover:text-[#F4D23C]/90"
            >
              Use magic link instead
            </button>
          ) : null}
          {variant === "athlete" && mode === "magic_link" ? (
            <button
              type="button"
              onClick={() => switchMode("email_code")}
              className="w-full text-center text-xs text-zinc-500 hover:text-[#F4D23C]/90"
            >
              Use 6-digit code instead
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}

export function AuthOtpFormFallback() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-center text-sm text-zinc-500">Loading…</p>
    </div>
  );
}
