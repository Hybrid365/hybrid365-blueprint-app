"use client";

import { useState } from "react";
import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { DailyReadinessInputs } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import { ReadinessRing } from "../today/ReadinessRing";
import { TodayReadinessCard } from "../today/TodayReadinessCard";
import { AthletePortalNavLink } from "../AthletePortalNavLink";

type Props = {
  readiness: HyroxDailyReadinessRow | null;
  saving?: boolean;
  disabled?: boolean;
  onSubmit: (input: DailyReadinessInputs & { timezone: string }) => Promise<boolean>;
};

export function HomeReadinessTile({ readiness, saving, disabled, onSubmit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const submitted = Boolean(readiness?.submitted_at);
  const category = readiness?.category ?? null;
  const label =
    category === "green"
      ? "Ready"
      : category === "red"
        ? "Recovery priority"
        : category === "amber"
          ? "Manage load"
          : "Not submitted";

  if (!submitted && !expanded) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Readiness
        </p>
        <p className="mt-2 text-sm font-bold text-white">Morning readiness</p>
        <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">
          Complete your check-in to personalise today&apos;s coaching view.
        </p>
        {disabled ? (
          <p className="mt-3 text-xs text-amber-200/80">Read-only preview</p>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 w-full rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
          >
            Submit readiness
          </button>
        )}
      </div>
    );
  }

  if (expanded && !submitted) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:col-span-2 lg:col-span-1">
        <TodayReadinessCard
          readiness={readiness}
          saving={saving}
          disabled={disabled}
          onSubmit={async (input) => {
            const ok = await onSubmit(input);
            if (ok) setExpanded(false);
            return ok;
          }}
        />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300"
        >
          Collapse
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Readiness</p>
      <div className="mt-2 flex items-center gap-3">
        <ReadinessRing score={readiness?.score ?? null} category={category} label={label} size={80} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {readiness?.explanation ?? "Readiness submitted for today."}
          </p>
          {readiness?.coaching_prompt ? (
            <p className="mt-1 line-clamp-2 text-xs font-medium text-yellow-200/90">
              {readiness.coaching_prompt}
            </p>
          ) : null}
        </div>
      </div>
      {!disabled ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-auto pt-3 text-left text-[11px] font-semibold text-yellow-400 hover:text-yellow-300"
        >
          Update readiness
        </button>
      ) : null}
      {expanded ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <TodayReadinessCard
            readiness={readiness}
            saving={saving}
            disabled={disabled}
            onSubmit={async (input) => {
              const ok = await onSubmit(input);
              if (ok) setExpanded(false);
              return ok;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function HomeCheckInTile({
  status,
  sub,
  due,
  readOnly,
}: {
  status: string;
  sub: string;
  due: boolean;
  readOnly?: boolean;
}) {
  const tone = due
    ? "border-amber-500/30 bg-amber-950/15"
    : status.toLowerCase().includes("review")
      ? "border-emerald-500/25 bg-emerald-950/10"
      : "border-zinc-800 bg-zinc-950/70";

  const inner = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Check-in
      </p>
      <p className={`mt-2 text-sm font-bold ${due ? "text-amber-200" : "text-white"}`}>{status}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{sub}</p>
      {due && !readOnly ? (
        <span className="mt-3 inline-block text-xs font-semibold text-yellow-400">
          Complete check-in →
        </span>
      ) : null}
    </>
  );

  if (readOnly) {
    return <div className={`flex h-full flex-col rounded-2xl border p-4 ${tone}`}>{inner}</div>;
  }

  return (
    <AthletePortalNavLink
      href="/athlete/check-in"
      className={`flex h-full flex-col rounded-2xl border p-4 transition hover:border-zinc-700 ${tone}`}
    >
      {inner}
    </AthletePortalNavLink>
  );
}
