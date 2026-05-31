"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import type { PublishedViewAthleteSummary } from "@/app/lib/hyroxCoachPublishedViewsServer";
import { ExternalLink, Eye } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PublishedViewsClient() {
  const [rows, setRows] = useState<PublishedViewAthleteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/hyrox/athletes/published-views");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "Could not load published views.");
        }
        setRows(Array.isArray(data.athletes) ? data.athletes : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <CoachAdminShell
      title="Published athlete views"
      backHref="/admin/hyrox-athletes"
      backLabel="Coach roster"
      actions={
        <Link
          href="/admin/hyrox-programme-preview"
          className="text-xs font-semibold text-zinc-500 hover:text-yellow-300"
        >
          Programme rules preview →
        </Link>
      }
    >
      <DashCard className="mb-6">
        <SectionHeading title="View as athlete (read-only)" />
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
          Preview what each athlete sees on their published dashboard and programme — without
          signing in as them or changing any data. Session logging, check-ins and edits are disabled
          in preview mode.
        </p>
      </DashCard>

      {loading ? <p className="text-sm text-zinc-500">Loading athletes…</p> : null}
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Athlete</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Block / focus</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/70 hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{row.name}</p>
                    <p className="text-xs text-zinc-500">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.hasPublishedBlock
                          ? "font-medium text-emerald-300"
                          : "text-zinc-500"
                      }
                    >
                      {row.publishedWeekLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {row.blockTitle ?? `Block ${row.currentBlock}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {row.programmeStatus.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(row.lastPublishedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {row.hasPublishedBlock ? (
                        <>
                          <Link
                            href={`/admin/hyrox-athletes/${row.id}/view-as`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:opacity-90"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View as athlete
                          </Link>
                          <Link
                            href={`/admin/hyrox-athletes/${row.id}?tab=Programme%20Builder`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-yellow-500/40 hover:text-yellow-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Coach workspace
                          </Link>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-600">No published block</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No athletes found.</p>
          ) : null}
        </div>
      ) : null}
    </CoachAdminShell>
  );
}
