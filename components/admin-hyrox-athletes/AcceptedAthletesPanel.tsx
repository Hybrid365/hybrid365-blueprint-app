"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HyroxAthleteListItem } from "@/app/lib/hyroxDatabaseTypes";
import { suggestedNextAthleteCoachAction } from "@/app/lib/hyroxAthleteStatus";
import { formatApplicationDate } from "@/app/lib/hyroxApplicationCoach";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";

function PaymentBadge({ status }: { status: string }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        paid
          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
          : "bg-amber-500/15 text-amber-200 ring-amber-500/30"
      }`}
    >
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

const ATHLETE_ONBOARDING_LOGIN_PATH = "/athlete/login?next=/athlete/onboarding";

function AthleteLoginLinkCopy() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${ATHLETE_ONBOARDING_LOGIN_PATH}`
          : ATHLETE_ONBOARDING_LOGIN_PATH;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
      <code className="rounded bg-zinc-900 px-2 py-1 text-zinc-300">
        {ATHLETE_ONBOARDING_LOGIN_PATH}
      </code>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function mergeListItemFromRow(
  prev: HyroxAthleteListItem,
  row: HyroxAthleteListItem
): HyroxAthleteListItem {
  return {
    ...prev,
    ...row,
    userLinked: Boolean(row.user_id),
  };
}

function AthleteRowActions({
  athlete,
  onUpdated,
}: {
  athlete: HyroxAthleteListItem;
  onUpdated: (updated: HyroxAthleteListItem) => void;
}) {
  const [localAthlete, setLocalAthlete] = useState(athlete);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState(athlete.email);
  const [paymentType, setPaymentType] = useState("");

  useEffect(() => {
    setLocalAthlete(athlete);
    setLinkEmail(athlete.email);
    setError(null);
    setMessage(null);
    if (process.env.NODE_ENV === "development") {
      console.log("Accepted athlete action id", athlete.id, athlete);
    }
  }, [athlete]);

  function formatActionError(data: { error?: string; detail?: string }) {
    if (process.env.NODE_ENV === "development" && data.detail) {
      console.error("[AcceptedAthletesPanel] action failed", data.error, data.detail);
      return `${data.error ?? "Action failed"}: ${data.detail}`;
    }
    return data.error ?? "Action failed.";
  }

  async function confirmPayment() {
    if (!localAthlete.id) {
      setError("Missing athlete id — refresh the list.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${localAthlete.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_link_type: paymentType || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        athlete?: HyroxAthleteListItem;
        error?: string;
        detail?: string;
        message?: string;
      };
      if (!res.ok || !data.success || !data.athlete) {
        setError(formatActionError(data));
        return;
      }
      const next = mergeListItemFromRow(localAthlete, {
        ...data.athlete,
        hasAssessment: localAthlete.hasAssessment,
        hasTesting: localAthlete.hasTesting,
        hasRaceResult: localAthlete.hasRaceResult,
      });
      setLocalAthlete(next);
      setMessage(data.message ?? "Payment confirmed.");
      onUpdated(next);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function relinkUser() {
    if (!localAthlete.id) {
      setError("Missing athlete id — refresh the list.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${localAthlete.id}/relink-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkEmail.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        athlete?: HyroxAthleteListItem;
        error?: string;
        detail?: string;
        message?: string;
        authUsers?: { id: string; email: string }[];
      };
      if (!res.ok || !data.success || !data.athlete) {
        if (data.error === "DUPLICATE_AUTH_USERS" && data.authUsers?.length) {
          setError(
            `Multiple auth accounts for this email. Relink with userId: ${data.authUsers.map((u) => u.id.slice(0, 8)).join(", ")}… (see server response).`
          );
        } else {
          setError(formatActionError(data));
        }
        return;
      }
      const next = mergeListItemFromRow(localAthlete, {
        ...data.athlete,
        hasAssessment: localAthlete.hasAssessment,
        hasTesting: localAthlete.hasTesting,
        hasRaceResult: localAthlete.hasRaceResult,
      });
      setLocalAthlete(next);
      setMessage(data.message ?? "Athlete relinked to auth user.");
      onUpdated(next);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function linkUser() {
    if (!localAthlete.id) {
      setError("Missing athlete id — refresh the list.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${localAthlete.id}/link-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkEmail.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        athlete?: HyroxAthleteListItem;
        error?: string;
        detail?: string;
        message?: string;
      };
      if (!res.ok || !data.success || !data.athlete) {
        setError(formatActionError(data));
        return;
      }
      const next = mergeListItemFromRow(localAthlete, {
        ...data.athlete,
        hasAssessment: localAthlete.hasAssessment,
        hasTesting: localAthlete.hasTesting,
        hasRaceResult: localAthlete.hasRaceResult,
      });
      setLocalAthlete(next);
      setMessage(data.message ?? "Account linked.");
      onUpdated(next);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!localAthlete?.id) {
    return (
      <div className="mt-3 border-t border-zinc-800/80 pt-3">
        <p className="text-xs text-red-300">Missing athlete id — refresh the list.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800/80 pt-3">
      {message ? (
        <p className="text-xs text-emerald-300">{message}</p>
      ) : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {localAthlete.payment_status === "pending" ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"
            aria-label="Payment link type"
          >
            <option value="">Payment type (optional)</option>
            <option value="monthly">Monthly</option>
            <option value="twelve_week">12-week</option>
            <option value="sixteen_week">16-week</option>
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmPayment()}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Mark payment confirmed
          </button>
        </div>
      ) : null}

      {localAthlete.payment_status === "paid" && !localAthlete.userLinked ? (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-zinc-400">
            Send the athlete{" "}
            <code className="text-zinc-300">/athlete/login?next=/athlete/onboarding</code>. If they
            use the same email they applied with, their account should auto-link after code login.
            If they see a sign-in mismatch (duplicate auth accounts), use Relink to auth user.
            Manual Link User remains available as a backup.
          </p>
          <AthleteLoginLinkCopy />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white"
              placeholder="Athlete login email"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void linkUser()}
              className="rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-black text-zinc-950 disabled:opacity-50"
            >
              Link user
            </button>
          </div>
        </div>
      ) : null}

      {localAthlete.payment_status === "paid" && localAthlete.userLinked ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            Linked to auth user · status:{" "}
            <span className="text-zinc-300">{localAthlete.status.replace(/_/g, " ")}</span>
          </p>
          <p className="text-xs leading-relaxed text-zinc-500">
            If the athlete sees a sign-in mismatch, use Relink to point this profile at the auth
            account they are actually using (same email).
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void relinkUser()}
            className="rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
          >
            Relink to auth user
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AcceptedAthletesPanel({ refreshToken = 0 }: { refreshToken?: number }) {
  const [athletes, setAthletes] = useState<HyroxAthleteListItem[]>([]);
  const [live, setLive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setLoadWarning(null);
    try {
      const res = await fetch("/api/hyrox/athletes");
      const data = (await res.json()) as {
        success?: boolean;
        live?: boolean;
        athletes?: HyroxAthleteListItem[];
        count?: number;
        error?: string;
        warning?: string;
      };

      if (process.env.NODE_ENV === "development") {
        console.log("Accepted athletes loaded", data.count ?? data.athletes?.length, data.athletes);
      }

      if (!res.ok || data.success === false) {
        setLive(false);
        setAthletes([]);
        setLoadError(data.error ?? "Could not load athletes from Supabase.");
        return;
      }

      const rows = Array.isArray(data.athletes) ? data.athletes : [];
      setLive(data.live === true);
      setAthletes(rows);
      if (data.warning) setLoadWarning(data.warning);
    } catch {
      setLive(false);
      setLoadError("Network error loading athletes.");
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">
            Accepted athletes (live)
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {live === true
              ? `${athletes.length} from hyrox_athletes — confirm payment, then link auth account`
              : live === false
                ? "Supabase unavailable"
                : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {loadError}
        </div>
      ) : null}

      {loadWarning && !loadError ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadWarning}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading athletes…</p>
      ) : athletes.length === 0 && !loadError ? (
        <DashCard>
          <p className="text-sm text-zinc-400">No athletes found.</p>
          <p className="mt-2 text-xs text-zinc-500">
            Accept an application to create a hyrox_athletes row, then confirm payment and link
            their login email.
          </p>
        </DashCard>
      ) : (
        <div className="space-y-3">
          {athletes.map((a) => (
            <DashCard key={a.id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{a.name}</p>
                    <p className="text-xs text-zinc-500">{a.email}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Added {formatApplicationDate(a.created_at)} · {a.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentBadge status={a.payment_status} />
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        a.userLinked ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      {a.userLinked ? "User linked" : "Not linked"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-zinc-500">
                  {a.hasAssessment ? "Assessment ✓" : "No assessment"} ·{" "}
                  {a.hasTesting ? "Testing ✓" : "No testing"} ·{" "}
                  {a.hasRaceResult ? "RoxFit ✓" : "No race"}
                </p>
                <p className="mt-1 text-xs text-yellow-200/80">
                  Next: {suggestedNextAthleteCoachAction(a)}
                </p>
                <Link
                  href={`/admin/hyrox-athletes/${a.id}?tab=${encodeURIComponent("Profile Review")}`}
                  className="mt-3 inline-flex rounded-full border border-yellow-500/30 px-3 py-1 text-[10px] font-bold text-yellow-200 hover:bg-yellow-400/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (process.env.NODE_ENV === "development") {
                      console.log("Open live athlete profile", a.id, a);
                    }
                  }}
                >
                  Open profile review
                </Link>
              </button>

              {expandedId === a.id ? (
                <AthleteRowActions
                  key={a.id}
                  athlete={a}
                  onUpdated={(updated) => {
                    setAthletes((prev) =>
                      prev.map((row) => (row.id === updated.id ? updated : row))
                    );
                  }}
                />
              ) : (
                <p className="mt-2 text-[10px] text-zinc-600">Tap row for actions</p>
              )}
            </DashCard>
          ))}
        </div>
      )}
    </>
  );
}
