"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AuthOtpForm, AuthOtpFormFallback } from "@/components/auth/AuthOtpForm";
import { sanitizeAuthNextPath } from "@/app/lib/authRedirectUrl";
import { getWhopJoinUrl } from "@/app/lib/hybrid365PublicLinks";

const WHOP_JOIN_URL = getWhopJoinUrl();

function LoginMembershipGuidance() {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-3.5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F4D23C]/90">
          Existing Hybrid365 members
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
          Log in using the exact same email you used to join Whop to access your Athlete
          Dashboard.
        </p>
      </div>
      <div className="border-t border-zinc-800/80 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          New here / not a member yet
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          You can verify your email, but the Athlete Dashboard only unlocks for active
          Hybrid365 members. Join through Whop first, then return here with the same email.
        </p>
        <a
          href={WHOP_JOIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Join Hybrid365
        </a>
      </div>
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
            Email code sign-in — no password. Magic link available if you prefer.
          </p>
        </div>

        <Suspense fallback={<AuthOtpFormFallback />}>
          <AuthOtpForm
            variant="community"
            sanitizeNext={sanitizeAuthNextPath}
            defaultMode="email_code"
            showModeTabs={false}
            magicLinkSubmitLabel="Send magic link"
            emailCodeSubmitLabel="Send login code"
            verifyCodeLabel="Verify code"
            guidance={<LoginMembershipGuidance />}
          />
        </Suspense>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Free training week?{" "}
          <Link href="/free-week" className="text-[#F4D23C] hover:underline">
            Get your blueprint
          </Link>
          {" · "}
          <Link href="/logout" className="text-zinc-500 hover:text-zinc-300">
            Sign out
          </Link>
        </p>
      </div>
    </div>
  );
}
