"use client";

import { useCallback, useEffect, useState } from "react";
import type { HyroxApplicationRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  formatApplicationDate,
  suggestedNextApplicationAction,
} from "@/app/lib/hyroxApplicationCoach";
import { ApplicationStatusBadge } from "@/components/admin-hyrox-athletes/ApplicationStatusBadge";
import { ApplicationReviewModal } from "@/components/admin-hyrox-athletes/ApplicationReviewModal";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";

export function ApplicationsPanel({
  onAcceptSuccess,
}: {
  onAcceptSuccess?: () => void;
}) {
  const [applications, setApplications] = useState<HyroxApplicationRow[]>([]);
  const [live, setLive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewApplication, setReviewApplication] = useState<HyroxApplicationRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setLoadWarning(null);
    try {
      const res = await fetch("/api/hyrox/applications");
      const data = (await res.json()) as {
        success?: boolean;
        live?: boolean;
        applications?: HyroxApplicationRow[];
        count?: number;
        error?: string;
        warning?: string;
      };

      if (process.env.NODE_ENV === "development") {
        console.log("[ApplicationsPanel] GET /api/hyrox/applications", {
          ok: res.ok,
          count: data.count ?? data.applications?.length,
          warning: data.warning,
          error: data.error,
        });
      }

      if (!res.ok || data.success === false) {
        setLive(false);
        setApplications([]);
        setLoadError(data.error ?? "Could not load applications from Supabase.");
        return;
      }

      const rows = Array.isArray(data.applications) ? data.applications : [];
      setLive(data.live === true);
      setApplications(rows);
      if (data.warning) setLoadWarning(data.warning);
    } catch {
      setLive(false);
      setLoadError("Network error loading applications.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">
            Live applications
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {live === true
              ? `${applications.length} from Supabase (hyrox_applications)`
              : live === false
                ? "Supabase unavailable — no live rows shown"
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
          <p className="mt-2 text-xs text-red-200/70">
            Ensure migrations 001–003 are applied and you are signed in as a coach. Mock coach
            athletes remain on the other tab.
          </p>
        </div>
      ) : null}

      {loadWarning && !loadError ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadWarning}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading applications…</p>
      ) : applications.length === 0 && !loadError ? (
        <DashCard>
          <p className="text-sm text-zinc-400">No applications found.</p>
          <p className="mt-2 text-xs text-zinc-500">
            Submissions from /hyrox-team/apply with status submitted, under_review, accepted, or
            rejected appear here when Supabase coach read access is configured.
          </p>
        </DashCard>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Instagram</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next action</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t border-zinc-800/80 hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{app.name}</p>
                      <p className="text-[11px] text-zinc-500">{app.email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {app.instagram_handle ? `@${app.instagram_handle}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{app.target_event ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{app.current_level ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {formatApplicationDate(app.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {suggestedNextApplicationAction(app.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (process.env.NODE_ENV === "development") {
                            console.log("Review application id", app.id);
                          }
                          setReviewApplication(app);
                          setReviewId(app.id);
                        }}
                        className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-xs font-bold text-yellow-200 ring-1 ring-yellow-500/30 hover:bg-yellow-400/25"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 lg:hidden">
            {applications.map((app) => (
              <DashCard key={app.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{app.name}</p>
                    <p className="text-xs text-zinc-500">{app.email}</p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {app.target_event ?? "No target"} · {formatApplicationDate(app.created_at)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {suggestedNextApplicationAction(app.status)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (process.env.NODE_ENV === "development") {
                      console.log("Review application id", app.id);
                    }
                    setReviewApplication(app);
                    setReviewId(app.id);
                  }}
                  className="mt-3 w-full rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-zinc-950"
                >
                  Review
                </button>
              </DashCard>
            ))}
          </div>
        </>
      )}

      <ApplicationReviewModal
        applicationId={reviewId}
        initialApplication={reviewApplication}
        onClose={() => {
          setReviewId(null);
          setReviewApplication(null);
        }}
        onUpdated={() => void load()}
        onAcceptSuccess={onAcceptSuccess}
      />
    </>
  );
}
