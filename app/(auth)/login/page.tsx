"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    urlError ? "error" : "idle"
  );
  const [message, setMessage] = useState(
    urlError === "auth" ? "Sign-in link expired or invalid. Try again." : ""
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/dashboard")}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {status === "sent" ? (
        <p className="text-center text-sm text-zinc-300">{message}</p>
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
              disabled={status === "loading"}
            />
          </div>
          {message && status === "error" ? (
            <p className="text-sm text-red-400">{message}</p>
          ) : null}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c235] disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Email me a link"}
          </button>
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
