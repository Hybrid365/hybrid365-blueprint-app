"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

export function WeeklyRationalePanel({
  value,
  onChange,
  onRegenerate,
  autoFilled,
}: {
  value: string;
  onChange: (v: string) => void;
  onRegenerate: () => void;
  autoFilled?: boolean;
}) {
  const touched = useRef(false);

  useEffect(() => {
    if (!touched.current && autoFilled && value) {
      touched.current = false;
    }
  }, [autoFilled, value]);

  return (
    <section className="rounded-2xl border border-yellow-500/25 bg-yellow-400/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white">Why this week is built this way</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Athlete-facing weekly note · editable before publish
          </p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          title="Regenerate from programme data"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:border-yellow-500/40 hover:text-yellow-300"
        >
          <RefreshCw className="h-3 w-3" />
          Auto-fill
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          touched.current = true;
          onChange(e.target.value);
        }}
        rows={8}
        placeholder="Auto-fill from block focus, limiters, Tuesday threshold, Thursday strength, Saturday key session, station exposure and recovery logic…"
        className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-zinc-600"
      />
      {autoFilled ? (
        <p className="mt-1 text-[10px] text-yellow-400/70">
          Generated from current week schedule — edit before publishing.
        </p>
      ) : null}
    </section>
  );
}
