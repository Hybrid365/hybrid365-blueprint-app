"use client";

import { visualMeta } from "@/components/athlete-command-centre/visual";

export type ModalitySliceView = {
  label: string;
  minutes: number | null;
  sessionCount: number;
};

/**
 * Duration distribution when logged minutes exist; otherwise session-count bars.
 * Never mixes units without an explicit mode label.
 */
export function ModalityMix({ slices }: { slices: ModalitySliceView[] }) {
  if (slices.length === 0) {
    return (
      <SparseModality
        title="No modality mix yet"
        body="Published sessions this week will appear here by type. Missing weeks stay empty."
      />
    );
  }

  const withDuration = slices.filter((row) => row.minutes != null && row.minutes > 0);
  const useDuration = withDuration.length > 0;

  if (useDuration) {
    const total = withDuration.reduce((sum, row) => sum + (row.minutes ?? 0), 0) || 1;
    return (
      <div data-h365-modality-mode="duration">
        <p className={visualMeta}>Training time · logged duration only</p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-sm bg-zinc-800">
          {withDuration.map((slice, i) => (
            <div
              key={slice.label}
              className={i % 2 === 0 ? "bg-yellow-400/80" : "bg-zinc-500"}
              style={{ width: `${((slice.minutes ?? 0) / total) * 100}%` }}
              title={`${slice.label}: ${slice.minutes} min`}
            />
          ))}
        </div>
        <ul className="mt-3 space-y-1.5">
          {withDuration.map((slice) => {
            const pct = Math.round(((slice.minutes ?? 0) / total) * 100);
            return (
              <li key={slice.label} className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                <span>{slice.label}</span>
                <span className="tabular-nums text-zinc-200">
                  {slice.minutes} min
                  <span className="ml-2 text-zinc-600">{pct}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const totalSessions = slices.reduce((sum, row) => sum + row.sessionCount, 0) || 1;
  return (
    <div data-h365-modality-mode="sessions">
      <p className={visualMeta}>Sessions · duration not logged — not training time</p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-sm bg-zinc-800">
        {slices.map((slice, i) => (
          <div
            key={slice.label}
            className={i % 2 === 0 ? "bg-yellow-400/70" : "bg-zinc-500"}
            style={{ width: `${(slice.sessionCount / totalSessions) * 100}%` }}
            title={`${slice.label}: ${slice.sessionCount} sessions`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {slices.map((slice) => {
          const pct = Math.round((slice.sessionCount / totalSessions) * 100);
          return (
            <li key={slice.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-xs text-zinc-400">{slice.label}</span>
                <span className="text-xs tabular-nums text-zinc-200">
                  {slice.sessionCount} session{slice.sessionCount === 1 ? "" : "s"}
                  <span className="ml-2 text-zinc-600">{pct}%</span>
                </span>
              </div>
              <div className="h-px bg-zinc-900">
                <div
                  className="h-px bg-yellow-400/60"
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SparseModality({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-5">
      <div className="flex h-2 overflow-hidden rounded-sm bg-zinc-900">
        <div className="w-1/4 bg-zinc-800" />
        <div className="w-1/5 bg-zinc-800/60" />
        <div className="flex-1" />
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-300">{title}</p>
      <p className={`mt-1 ${visualMeta}`}>{body}</p>
    </div>
  );
}
