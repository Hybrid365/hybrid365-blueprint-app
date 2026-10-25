"use client";

import {
  buildProgrammingAnchorsSummary,
  programmingAnchorProvenanceLine,
  type ProgrammingAnchorItem,
  type ProgrammingAnchorsSummary,
} from "@/app/lib/hyroxProgrammingAnchors";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";

function freshnessClass(item: ProgrammingAnchorItem): string {
  if (item.freshness === "not_set") return "text-zinc-600";
  if (item.freshness === "stale") return "text-amber-200/90";
  return "text-white";
}

function AnchorRow({
  item,
  dense,
}: {
  item: ProgrammingAnchorItem;
  dense?: boolean;
}) {
  const value = item.primary ?? "Not set";
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-zinc-800/80 ${
        dense ? "py-1.5" : "py-2"
      } last:border-b-0`}
    >
      <div className="min-w-0">
        <p
          className={`font-semibold uppercase tracking-wider text-zinc-500 ${
            dense ? "text-[9px]" : "text-[10px]"
          }`}
        >
          {item.label}
        </p>
        <p className={`font-bold tabular-nums ${dense ? "text-xs" : "text-sm"} ${freshnessClass(item)}`}>
          {value}
        </p>
        {item.secondary && item.primary ? (
          <p className={`tabular-nums text-zinc-500 ${dense ? "text-[9px]" : "text-[10px]"}`}>
            {item.secondary}
          </p>
        ) : null}
      </div>
      <div className={`shrink-0 text-right ${dense ? "text-[9px]" : "text-[10px]"}`}>
        <p
          className={
            item.freshness === "not_set"
              ? "text-zinc-600"
              : item.freshness === "stale"
                ? "text-amber-300/80"
                : "text-zinc-400"
          }
        >
          {programmingAnchorProvenanceLine(item)}
        </p>
        {item.freshness === "stale" ? (
          <p className="text-amber-400/70">Stale</p>
        ) : item.freshness === "current" ? (
          <p className="text-emerald-500/60">Current</p>
        ) : null}
      </div>
    </div>
  );
}

export function ProgrammingAnchorsPanel({
  profile,
  summary: summaryProp,
  variant = "overview",
  pendingCount,
  unavailable,
  onOpenProfile,
  className = "",
}: {
  profile?: HyroxAthletePerformanceProfile | null;
  summary?: ProgrammingAnchorsSummary | null;
  variant?: "overview" | "compact";
  pendingCount?: number | null;
  unavailable?: boolean;
  onOpenProfile?: () => void;
  className?: string;
}) {
  const summary =
    summaryProp ??
    buildProgrammingAnchorsSummary(profile ?? null, {
      includeRun10k: variant === "overview",
    });
  const dense = variant === "compact";

  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-950/80 ${dense ? "p-3" : "p-4"} ${className}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/85">
            Programming Anchors
          </p>
          {!dense ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Active values only · missing stays Not set · never estimated
            </p>
          ) : null}
        </div>
        {onOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="shrink-0 text-[10px] font-semibold text-yellow-400/90 hover:text-yellow-300"
          >
            Performance Profile
          </button>
        ) : null}
      </div>

      {unavailable ? (
        <p className="text-xs text-zinc-500">
          Performance Profile unavailable. Anchors cannot be loaded.
        </p>
      ) : (
        <>
          {pendingCount != null && pendingCount > 0 ? (
            <p className="mb-2 rounded border border-amber-500/25 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-100/90">
              {pendingCount} pending athlete submission
              {pendingCount === 1 ? "" : "s"} — not used for programming until approved &amp; activated.
            </p>
          ) : null}

          {dense ? (
            <div>
              {summary.items.map((item) => (
                <AnchorRow key={item.key} item={item} dense />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {summary.groups.map((group) => (
                <div key={group.id}>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    {group.label}
                  </p>
                  <div>
                    {group.items.map((item) => (
                      <AnchorRow key={item.key} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary.missingCount > 0 && dense ? (
            <p className="mt-2 text-[9px] text-zinc-600">
              {summary.missingCount} not set · set coach estimate on Performance Profile
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
