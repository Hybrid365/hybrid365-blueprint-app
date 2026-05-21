"use client";

import { useCallback, useEffect, useState } from "react";
import type { HyroxApplicationRow, HyroxApplicationStatus } from "@/app/lib/hyroxDatabaseTypes";
import { ApplicationStatusBadge } from "@/components/admin-hyrox-athletes/ApplicationStatusBadge";
import { formatApplicationDate } from "@/app/lib/hyroxApplicationCoach";

type Props = {
  applicationId: string | null;
  /** Row from list — shown immediately while refetch runs */
  initialApplication?: HyroxApplicationRow | null;
  onClose: () => void;
  onUpdated: () => void;
  onAcceptSuccess?: () => void;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function ApplicationReviewModal({
  applicationId,
  initialApplication = null,
  onClose,
  onUpdated,
  onAcceptSuccess,
}: Props) {
  const [application, setApplication] = useState<HyroxApplicationRow | null>(
    initialApplication?.id === applicationId ? initialApplication : null
  );
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hyrox/applications/${applicationId}`);
      const data = (await res.json()) as {
        success?: boolean;
        application?: HyroxApplicationRow;
        error?: string;
      };

      if (process.env.NODE_ENV === "development") {
        console.log("[ApplicationReviewModal] fetch", applicationId, {
          ok: res.ok,
          hasApplication: Boolean(data.application),
          error: data.error,
        });
      }

      if (!res.ok || !data.application) {
        setError(
          data.error ??
            (res.status === 404 ? "Application not found." : "Could not load application.")
        );
        if (!initialApplication || initialApplication.id !== applicationId) {
          setApplication(null);
        }
        return;
      }
      setApplication(data.application);
      setCoachNotes(data.application.coach_notes ?? "");
    } catch {
      setError("Network error loading application.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, initialApplication]);

  useEffect(() => {
    if (initialApplication?.id === applicationId) {
      setApplication(initialApplication);
      setCoachNotes(initialApplication.coach_notes ?? "");
    }
    void load();
  }, [load, applicationId, initialApplication]);

  async function patchStatus(status: HyroxApplicationStatus, notes?: string) {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/hyrox/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          coach_notes: notes ?? coachNotes,
        }),
      });
      const data = (await res.json()) as { success?: boolean; application?: HyroxApplicationRow; error?: string };
      if (!res.ok || !data.application) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setApplication(data.application);
      onUpdated();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptApplication() {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/hyrox/applications/${applicationId}/accept`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        success?: boolean;
        application?: HyroxApplicationRow;
        error?: string;
        detail?: string;
        message?: string;
      };
      if (!res.ok || !data.application) {
        setError(
          data.error === "ATHLETE_CREATE_FAILED" && data.detail
            ? `Could not create athlete: ${data.detail}`
            : (data.error ?? "Accept failed.")
        );
        if (process.env.NODE_ENV === "development" && data.detail) {
          console.error("[ApplicationReviewModal] accept failed", data.error, data.detail);
        }
        return;
      }
      setApplication(data.application);
      setSuccess(data.message ?? "Athlete created. Send accepted/payment link manually.");
      onUpdated();
      onAcceptSuccess?.();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!applicationId) return null;

  const raw = application?.raw_payload ?? {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="application-review-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
              Application review
            </p>
            <h2 id="application-review-title" className="text-lg font-bold text-white">
              {application?.name ?? "Loading…"}
            </h2>
            {application ? (
              <p className="mt-1 text-xs text-zinc-500">
                Submitted {formatApplicationDate(application.created_at)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && !application ? (
            <p className="text-sm text-zinc-500">Loading application…</p>
          ) : null}
          {!loading && !application && !error ? (
            <p className="text-sm text-zinc-500">Application not found.</p>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          {application ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <ApplicationStatusBadge status={application.status} />
                {application.documentation_interest ? (
                  <span className="text-[10px] text-zinc-500">Documentation: interested</span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Documentation: not requested</span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Email" value={application.email} />
                <DetailRow
                  label="Instagram"
                  value={
                    application.instagram_handle
                      ? `@${application.instagram_handle}`
                      : null
                  }
                />
                <DetailRow label="Hyrox experience" value={application.hyrox_experience} />
                <DetailRow label="Current level / PB" value={application.current_level} />
                <DetailRow label="Target event" value={application.target_event} />
                <DetailRow label="Target date" value={application.target_date} />
              </div>

              <DetailRow label="Main goal" value={application.goal} />
              <DetailRow label="Why join" value={application.reason_for_applying} />

              {Object.keys(raw).length > 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Additional form fields
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    {Object.entries(raw).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="text-zinc-500 capitalize">{k.replace(/_/g, " ")}</dt>
                        <dd className="text-zinc-300">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="coach-notes"
                  className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                >
                  Coach notes
                </label>
                <textarea
                  id="coach-notes"
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="Internal notes (optional on reject)…"
                />
              </div>
            </>
          ) : null}
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            disabled={busy || !application}
            onClick={() => void patchStatus("under_review")}
            className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 disabled:opacity-50"
          >
            Mark under review
          </button>
          <button
            type="button"
            disabled={busy || !application || application.status === "accepted"}
            onClick={() => void acceptApplication()}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy || !application}
            onClick={() => void patchStatus("rejected")}
            className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50"
          >
            Reject
          </button>
        </footer>
      </div>
    </div>
  );
}
