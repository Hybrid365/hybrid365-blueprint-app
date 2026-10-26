"use client";

import type { LibraryGapDashboard } from "@/app/lib/hyroxLibraryGapDashboard";

/**
 * Coach-facing programming gaps from Week Composer.
 * Development aggregates stay collapsed — no raw noise codes in the primary list.
 */
export function LibraryGapDashboardPanel({
  dashboard,
  showDevelopment = false,
}: {
  dashboard: LibraryGapDashboard;
  showDevelopment?: boolean;
}) {
  if (!dashboard.coachGaps.length && !dashboard.development.total) return null;

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-950/15 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
        Programming gaps
      </p>
      {dashboard.coachGaps.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-500">No coach-facing gaps on this proposal.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {dashboard.coachGaps.map((g, i) => (
            <li key={`${g.kind}-${g.day}-${g.familyId}-${i}`} className="text-xs text-amber-50/90">
              <span className="font-semibold text-amber-200">{g.title}</span>
              {g.day ? <span className="text-zinc-500"> · {g.day}</span> : null}
              <p className="text-[11px] text-zinc-400">{g.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {showDevelopment && dashboard.development.total > 0 ? (
        <details className="mt-2 border-t border-amber-500/20 pt-2">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Dev aggregate · {dashboard.development.total} raw
          </summary>
          <ul className="mt-1 space-y-0.5 text-[10px] text-zinc-500">
            {dashboard.development.byCode.map((c) => (
              <li key={c.code}>
                {c.code} ×{c.count}
                {c.familyIds.length ? ` · ${c.familyIds.slice(0, 3).join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
