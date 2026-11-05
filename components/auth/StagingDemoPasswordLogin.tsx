"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AUTH_ATHLETE_DEFAULT_NEXT,
  sanitizeAthleteAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import {
  STAGING_DEMO_COMPETITIVE_EMAIL,
  isStagingDemoPasswordLoginAllowed,
} from "@/app/lib/stagingDemoAthleteAuth";
import { createClient } from "@/app/lib/supabase/client";

/**
 * Staging / Preview only — Demo Competitive email+password for repeated visual review.
 * Hidden whenever Production Supabase or Vercel Production is detected.
 */
export function StagingDemoPasswordLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allowed = isStagingDemoPasswordLoginAllowed();

  const [email, setEmail] = useState(STAGING_DEMO_COMPETITIVE_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!allowed) return null;

  const next = sanitizeAthleteAuthNextPath(
    searchParams.get("next") ?? AUTH_ATHLETE_DEFAULT_NEXT
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signError) {
        setError(signError.message || "Sign-in failed.");
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-4">
      <p className="label-caps text-[10px] text-yellow-200/90">
        Staging demo · password login
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Synthetic Demo Competitive only. Not available in Production.
      </p>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <label className="block">
          <span className="label-caps text-[10px] text-zinc-500">Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/50"
          />
        </label>
        <label className="block">
          <span className="label-caps text-[10px] text-zinc-500">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/50"
            required
          />
        </label>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[#F4D23C] text-sm font-semibold text-zinc-950 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in as Demo Competitive"}
        </button>
      </form>
    </div>
  );
}
