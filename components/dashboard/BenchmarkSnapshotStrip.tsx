import Link from "next/link";
import { ArrowRight, Dumbbell } from "lucide-react";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";

type Props = {
  items: BenchmarkSnapshotItem[];
  compact?: boolean;
  testingHref?: string;
};

export function BenchmarkSnapshotStrip({ items, compact, testingHref = "/dashboard/testing" }: Props) {
  const anyLogged = items.some((b) => b.logged);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-yellow-400" />
          <h3 className={`font-bold text-white ${compact ? "text-sm" : "text-base"}`}>
            Benchmark snapshot
          </h3>
        </div>
        <Link
          href={testingHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300"
        >
          {anyLogged ? "Update tests" : "Add baseline tests"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!anyLogged ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Add baseline tests to start tracking progress.
        </p>
      ) : (
        <div
          className={`mt-4 grid gap-3 ${
            compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {items.map((b) => (
            <div
              key={b.label}
              className="min-w-0 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3"
            >
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {b.label}
              </p>
              <p className="mt-0.5 break-words text-sm font-semibold text-white">
                {b.logged ? b.latest : "Not logged"}
              </p>
              {b.logged && b.change ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Change: <span className="text-zinc-300">{b.change}</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
