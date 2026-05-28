"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AuthOtpForm, AuthOtpFormFallback } from "@/components/auth/AuthOtpForm";
import {
  AUTH_ATHLETE_DEFAULT_NEXT,
  sanitizeAthleteAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import { HYROX_TEAM_EMAIL_LINKING_NOTE } from "@/components/hyrox-team/hyroxTeamOfferCopy";

function AthleteLoginInfoCard() {
  return (
    <div className="mt-3 rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-3.5">
      <p className="text-xs leading-relaxed text-zinc-300">{HYROX_TEAM_EMAIL_LINKING_NOTE}</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        If your coach has not activated your account yet, you may see a waiting message until your
        profile is linked.
      </p>
    </div>
  );
}

export default function AthleteLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200/90">
            <span className="h-2 w-2 rounded-full bg-[#F4D23C]" />
            Hyrox Team 1-1
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Hybrid365 Hyrox Team Login
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Access your athlete onboarding, assessment, testing and programme dashboard.
          </p>
        </div>

        <Suspense fallback={<AuthOtpFormFallback />}>
          <AuthOtpForm
            variant="athlete"
            sanitizeNext={(value) =>
              sanitizeAthleteAuthNextPath(value ?? AUTH_ATHLETE_DEFAULT_NEXT)
            }
            defaultMode="email_code"
            showModeTabs={false}
            emailCodeSubmitLabel="Send login code"
            verifyCodeLabel="Verify code"
            magicLinkSubmitLabel="Email me my athlete login link"
            guidance={<AthleteLoginInfoCard />}
            emailCodeHint={
              <p className="text-xs leading-relaxed text-zinc-500">
                We&apos;ll email a 6-digit code — no password. Enter it on this page after it
                arrives.
              </p>
            }
            footerHelp="Code expires after a short time. Request a new one if needed."
          />
        </Suspense>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-500">
          Accepted athletes only. Your programme unlocks after payment, assessment, testing and
          coach review.
        </p>

        <p className="mt-8 text-center text-xs text-zinc-500">
          <Link href="/logout?next=/athlete/login" className="text-zinc-500 hover:text-zinc-300">
            Sign out
          </Link>
        </p>
      </div>
    </div>
  );
}
