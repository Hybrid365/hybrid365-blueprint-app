"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Hybrid11ApplicationRow } from "@/app/lib/hybrid11DatabaseTypes";
import {
  experienceSummary,
  formatHybrid11ApplicationDate,
  suggestedHybrid11NextAction,
  trainingDaysFromApplication,
} from "@/app/lib/hybrid11ApplicationCoach";
import {
  HYBRID11_APPLICATION_TYPE_LABEL,
  HYBRID11_TRACK_LABEL,
} from "@/app/lib/hybrid11DatabaseTypes";
import { Hybrid11StatusBadge } from "@/components/admin-one-to-one-applications/Hybrid11StatusBadge";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";

export function Hybrid11ApplicationsPanel() {
  const [applications, setApplications] = useState<Hybrid11ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setLoadWarning(null);
    try {
      const res = await fetch("/api/hybrid-1-1/applications");
      const data = (await res.json()) as {
        success?: boolean;
        applications?: Hybrid11ApplicationRow[];
        error?: string;
        warning?: string;
      };

      if (!res.ok || data.success === false) {
        setApplications([]);
        setLoadError(data.error ?? "Could not load applications.");
        return;
      }

      setApplications(Array.isArray(data.applications) ? data.applications : []);
      if (data.warning) setLoadWarning(data.warning);
    } catch {
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
            Hybrid 1-1 applications
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading…" : `${applications.length} from hybrid_1_1_applications`}
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
            Apply migration 013_hybrid_1_1_applications.sql in Supabase and sign in as coach/admin.
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
          <p className="text-sm text-zinc-400">No Hybrid 1-1 applications yet.</p>
          <p className="mt-2 text-xs text-zinc-500">
            Submissions from /one-to-one-coaching/apply appear here — separate from HYROX Team.
          </p>
        </DashCard>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">Applicant</th>
                  <th className="pb-3 pr-4 font-semibold">Type / track</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Submitted</th>
                  <th className="pb-3 pr-4 font-semibold">Main goal</th>
                  <th className="pb-3 pr-4 font-semibold">Days</th>
                  <th className="pb-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-zinc-800/80">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-white">{app.full_name}</p>
                      <p className="text-xs text-zinc-500">{app.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-400">
                      {HYBRID11_APPLICATION_TYPE_LABEL}
                      <br />
                      {HYBRID11_TRACK_LABEL}
                    </td>
                    <td className="py-3 pr-4">
                      <Hybrid11StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {formatHybrid11ApplicationDate(app.created_at)}
                    </td>
                    <td className="max-w-[200px] py-3 pr-4 truncate text-zinc-300">
                      {app.main_goal ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">{trainingDaysFromApplication(app)}</td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/one-to-one-applications/${app.id}`}
                        className="text-xs font-semibold text-yellow-400 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {applications.map((app) => (
              <DashCard key={app.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{app.full_name}</p>
                    <p className="text-xs text-zinc-500">{app.email}</p>
                  </div>
                  <Hybrid11StatusBadge status={app.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {HYBRID11_APPLICATION_TYPE_LABEL} · {formatHybrid11ApplicationDate(app.created_at)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{app.main_goal ?? "—"}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {trainingDaysFromApplication(app)} · {experienceSummary(app)}
                </p>
                <Link
                  href={`/admin/one-to-one-applications/${app.id}`}
                  className="mt-3 inline-block text-xs font-semibold text-yellow-400"
                >
                  View application →
                </Link>
              </DashCard>
            ))}
          </div>
        </>
      )}

      {!loading && applications.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-600">
          Next action hint: {suggestedHybrid11NextAction(applications[0]?.status ?? "new")}
        </p>
      ) : null}
    </>
  );
}
