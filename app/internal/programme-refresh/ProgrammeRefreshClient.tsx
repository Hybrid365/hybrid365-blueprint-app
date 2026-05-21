"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import type { MemberRefreshLookup } from "@/app/lib/internalProgrammeRefreshServer";
import { REFRESH_CONFIRM_TOKEN } from "@/app/lib/internalProgrammeRefreshServer";

type Props = {
  adminEmail: string;
  adminListConfigured: boolean;
};

type SuccessPayload = {
  email: string;
  userId: string;
  weeksGenerated: number;
  unlockedWeeks: number[];
  programmeInstanceId: string;
  replacedExisting: boolean;
  sessionLogsPreserved: number;
  checkInsPreserved: number;
};

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ProgrammeRefreshClient({
  adminEmail,
  adminListConfigured,
}: Props) {
  const [email, setEmail] = useState("");
  const [member, setMember] = useState<MemberRefreshLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState("");
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError(null);
    setMember(null);
    setSuccess(null);
    setRefreshError(null);
    try {
      const res = await fetch(
        `/api/internal/programme-refresh?email=${encodeURIComponent(email.trim())}`
      );
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberRefreshLookup;
      };
      if (!res.ok) {
        throw new Error(payload.error || "Lookup failed");
      }
      setMember(payload.member ?? null);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleFullRefresh() {
    if (!member) return;
    setRefreshLoading(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/internal/programme-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          confirm: confirmText,
          mode: "full",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as SuccessPayload & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Refresh failed");
      }
      setSuccess(payload);
      setConfirmText("");
      setMember(null);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshLoading(false);
    }
  }

  const confirmOk = confirmText.trim() === REFRESH_CONFIRM_TOKEN;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500/90">
          Hybrid365 internal
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Programme refresh</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{adminEmail}</span>
          {adminListConfigured ? (
            <span className="text-zinc-500"> · INTERNAL_ADMIN_EMAILS active</span>
          ) : null}
        </p>

        <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
          Use this only when the athlete&apos;s goal, availability, equipment, 5km time, max HR,
          injury status or programme track was significantly wrong. This does not change Whop
          membership or free-week access.
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Search member</h2>
          <form onSubmit={handleLookup} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-50"
            >
              {lookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Look up
            </button>
          </form>
          {lookupError ? <p className="mt-3 text-sm text-red-300">{lookupError}</p> : null}
        </section>

        {success ? (
          <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Programme regenerated successfully</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  {success.weeksGenerated} weeks saved for{" "}
                  <span className="font-medium text-white">{success.email}</span> (instance{" "}
                  <span className="font-mono text-xs text-zinc-400">{success.programmeInstanceId}</span>
                  ).
                </p>
                <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                  <li>Unlocked weeks: {success.unlockedWeeks.join(", ") || "none (inactive membership)"}</li>
                  <li>
                    {success.replacedExisting
                      ? "Replaced existing programme weeks on the same instance."
                      : "Created a new programme instance."}
                  </li>
                  <li>
                    Preserved {success.sessionLogsPreserved} session log(s) and{" "}
                    {success.checkInsPreserved} check-in(s) — keys may not match new sessions.
                  </li>
                </ul>
                <p className="mt-4 text-sm text-zinc-300">
                  Tell the member to refresh the app or re-open their dashboard to see the new plan.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    Member dashboard (your view)
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(null);
                      setEmail(success.email);
                    }}
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    Refresh another member
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {member && !success ? (
          <>
            <section className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Member summary</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">User ID</dt>
                  <dd className="mt-0.5 font-mono text-xs text-zinc-200">{member.userId}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="mt-0.5 text-zinc-200">{member.email}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Membership</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {member.membership.status ?? "—"}
                    {member.membership.active ? " (active)" : " (inactive)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Programme</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {member.programme.hasProgramme
                      ? `${member.programme.weeksWithPlan} weeks · current week ${member.programme.currentWeek ?? "—"}`
                      : "No generated programme"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Last programme write</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {formatWhen(member.programme.generatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Assessment updated</dt>
                  <dd className="mt-0.5 text-zinc-200">
                    {formatWhen(member.assessment.updatedAt ?? member.assessment.completedAt)}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                <p className="font-semibold text-zinc-200">Assessment</p>
                <p className="mt-1">
                  {member.assessment.completed ? "Complete" : "Incomplete"} · Goal:{" "}
                  {member.assessment.goalFocus ?? "—"} · 5km: {member.assessment.recent5k ?? "—"} · Max
                  HR: {member.assessment.maxHeartRate ?? "—"}
                </p>
              </div>

              {member.assessmentChangedSinceProgramme ? (
                <p className="rounded-lg border border-yellow-500/25 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
                  Assessment was updated after the current programme was generated — refresh is
                  appropriate if changes are significant.
                </p>
              ) : null}

              <p className="text-xs text-zinc-500">
                Session logs: {member.programme.sessionLogCount} · Check-ins:{" "}
                {member.programme.checkInCount}
              </p>
            </section>

            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Refresh type</h2>

              <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-400/5 p-4">
                <p className="font-semibold text-yellow-200">A. Full reset / regenerate</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Replaces all 12 programme weeks from the latest assessment (same engine as member
                  generate). Resets current week to 1. Keeps the same programme instance when possible
                  so logs and check-ins remain linked.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 opacity-70">
                <p className="font-semibold text-zinc-400">B. Future weeks only</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Coming soon — for now use full reset before the athlete has built meaningful
                  training history.
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 sm:p-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-white">Confirm full refresh</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    This will replace the member&apos;s current programme. Do not use if they have
                    already built meaningful training history unless you intend to reset their plan.
                  </p>
                  <p className="mt-3 text-sm text-zinc-400">
                    Type <span className="font-mono font-bold text-white">{REFRESH_CONFIRM_TOKEN}</span>{" "}
                    to confirm.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={REFRESH_CONFIRM_TOKEN}
                    className={`${inputClass} mt-3`}
                    autoComplete="off"
                  />
                  {refreshError ? <p className="mt-3 text-sm text-red-300">{refreshError}</p> : null}
                  <button
                    type="button"
                    disabled={!confirmOk || refreshLoading || !member.assessment.completed}
                    onClick={handleFullRefresh}
                    className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {refreshLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-5 w-5" />
                    )}
                    Run full programme refresh
                  </button>
                  {!member.assessment.completed ? (
                    <p className="mt-2 text-sm text-amber-300">
                      Assessment must be complete before refresh.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <p className="mt-10 text-center text-xs text-zinc-600">
          <Link href="/internal/programme-preview" className="underline hover:text-zinc-400">
            Programme QA preview
          </Link>
          {" · "}
          Community admin tool only — HYROX routes unchanged
        </p>
      </div>
    </div>
  );
}
