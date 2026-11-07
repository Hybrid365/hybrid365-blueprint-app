"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  benchmarkAgeLabel,
  type HyroxAthleteBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkTypes";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import {
  buildProgrammingAnchorsSummary,
  programmingAnchorProvenanceLine,
} from "@/app/lib/hyroxProgrammingAnchors";
import {
  FadeIn,
  MotionEnter,
  StatusPill,
  athleteBenchmarkStatus,
  visualCard,
  visualCardPad,
  visualEyebrow,
  visualMeta,
  visualNumber,
} from "@/components/athlete-command-centre/visual";
import {
  athleteSourceLabel,
  buildModalityPanels,
  computeMarkDelta,
  currentAnchors,
  findPreviousMark,
  formatMarkDate,
  pendingMarks,
  pickPrimaryAnchor,
  type PerformanceMark,
} from "./performanceMath";

export function PerformanceExperience({
  results,
  profile,
  submitSlot,
}: {
  results: HyroxAthleteBenchmarkRow[];
  profile: HyroxAthletePerformanceProfile | null | undefined;
  submitSlot?: React.ReactNode;
}) {
  const anchors = useMemo(() => currentAnchors(results), [results]);
  const pending = useMemo(() => pendingMarks(results), [results]);
  const primaryDefault = pickPrimaryAnchor(anchors);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    anchors.find((mark) => mark.row.id === selectedId) ?? primaryDefault ?? null;

  const previous = selected ? findPreviousMark(results, selected.row) : null;
  const delta =
    selected && previous ? computeMarkDelta(selected.row, previous.row) : null;
  const modalities = buildModalityPanels(anchors);
  const anchorsSummary = buildProgrammingAnchorsSummary(profile);
  const setAnchors = anchorsSummary.items.filter((item) => item.freshness !== "not_set");
  const missingAnchors = anchorsSummary.items.filter((item) => item.freshness === "not_set");

  return (
    <div className="space-y-8 lg:space-y-9" data-h365-performance-experience="">
      <MotionEnter>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={visualEyebrow}>Now · what can I do right now?</p>
            <p className={`mt-1.5 ${visualMeta}`}>
              Current programming anchors from approved, activated benchmarks only
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/athlete/performance-testing"
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white"
            >
              View testing
            </Link>
          </div>
        </div>
      </MotionEnter>

      <MotionEnter>
        <section className={`${visualCard} ${visualCardPad}`}>
          {!selected ? (
            <EmptyHero />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-8">
              <FadeIn key={selected.row.id}>
                <HeroMark mark={selected} previous={previous} delta={delta} />
              </FadeIn>
              <div>
                <p className={visualEyebrow}>Programming anchors</p>
                <p className={`mt-1 ${visualMeta}`}>Active marks your programme can use</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {anchors.map((mark) => {
                    const active = mark.row.id === selected.row.id;
                    const age = benchmarkAgeLabel(mark.row.result_date);
                    return (
                      <li key={mark.row.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(mark.row.id)}
                          className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                            active
                              ? "border-yellow-400/50 bg-yellow-400/10"
                              : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                              {mark.label}
                            </p>
                            {active ? <StatusPill status="current" /> : null}
                          </div>
                          <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-white">
                            {mark.primary}
                          </p>
                          {mark.derived ? (
                            <p className="mt-1 text-xs tabular-nums text-zinc-400">{mark.derived}</p>
                          ) : null}
                          <p className={`mt-2 ${visualMeta}`}>
                            {[athleteSourceLabel(mark.row.source), age].filter(Boolean).join(" · ")}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {missingAnchors.length > 0 ? (
                  <p className={`mt-4 ${visualMeta}`}>
                    Not set: {missingAnchors.map((item) => item.label).join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </MotionEnter>

      {modalities.length > 0 ? (
        <MotionEnter>
          <section>
            <p className={visualEyebrow}>Capability by modality</p>
            <p className={`mt-1 ${visualMeta}`}>Only modalities with an active mark</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modalities.map((panel) => (
                <article key={panel.id} className={`${visualCard} px-4 py-4`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {panel.label}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {panel.marks.map((mark) => (
                      <li key={mark.row.id} className="flex items-baseline justify-between gap-3">
                        <span className="text-xs text-zinc-400">{mark.label}</span>
                        <span className="text-sm font-semibold tabular-nums text-white">
                          {mark.primary}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </MotionEnter>
      ) : null}

      {setAnchors.length > 0 ? (
        <MotionEnter>
          <section className="border-t border-zinc-800 pt-7">
            <p className={visualEyebrow}>Freshness</p>
            <p className={`mt-1 ${visualMeta}`}>Where each active programming mark came from</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {setAnchors.map((item) => (
                <li
                  key={item.key}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3.5 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{item.label}</p>
                    <p className={`mt-1 ${visualMeta}`}>{programmingAnchorProvenanceLine(item)}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-white">{item.primary}</p>
                </li>
              ))}
            </ul>
          </section>
        </MotionEnter>
      ) : null}

      {pending.length > 0 ? (
        <MotionEnter>
          <section className="border-t border-zinc-800 pt-7">
            <p className={visualEyebrow}>Awaiting review</p>
            <p className={`mt-1 ${visualMeta}`}>
              Submitted results stay pending. They do not change your current anchors.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {pending.map((mark) => (
                <li key={mark.row.id} className={`${visualCard} ${visualCardPad}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                      {mark.label}
                    </p>
                    <StatusPill status="pending" />
                  </div>
                  <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">
                    {mark.primary}
                  </p>
                  {mark.derived ? (
                    <p className="mt-1 text-sm tabular-nums text-zinc-300">{mark.derived}</p>
                  ) : null}
                  <p className={`mt-3 ${visualMeta}`}>
                    {formatMarkDate(mark.row.result_date)} · waiting for coach review
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </MotionEnter>
      ) : null}

      {submitSlot ? <MotionEnter>{submitSlot}</MotionEnter> : null}
    </div>
  );
}

function HeroMark({
  mark,
  previous,
  delta,
}: {
  mark: PerformanceMark;
  previous: PerformanceMark | null;
  delta: { absoluteLabel: string; improved: boolean | null } | null;
}) {
  const age = benchmarkAgeLabel(mark.row.result_date);
  return (
    <div data-h365-performance-hero="">
      <p className={visualEyebrow}>Current · {mark.label}</p>
      <p className={`mt-3 ${visualNumber} sm:text-5xl`}>{mark.primary}</p>
      {mark.derived ? (
        <p className="mt-2 text-lg tabular-nums text-zinc-300">{mark.derived}</p>
      ) : null}
      {delta ? (
        <p className="mt-2 text-sm font-medium text-zinc-200">
          <span className="tabular-nums text-white">{delta.absoluteLabel}</span>
          <span className="text-zinc-500"> vs previous mark</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={athleteBenchmarkStatus(mark.row)} />
        <span className={visualMeta}>
          {[formatMarkDate(mark.row.result_date), athleteSourceLabel(mark.row.source), age]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      {previous ? (
        <div className="mt-6 border-t border-zinc-800 pt-5">
          <p className={visualEyebrow}>Previous</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-200">{previous.primary}</p>
          <p className={visualMeta}>
            {[previous.derived, "historical · not the programming anchor"]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className={`mt-1 ${visualMeta}`}>
            {formatMarkDate(previous.row.result_date)} · {athleteSourceLabel(previous.row.source)}
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-4">
          <p className={visualEyebrow}>Previous</p>
          <p className={`mt-2 text-sm leading-relaxed text-zinc-400`}>
            No earlier approved mark for {mark.label}. Progress will show longitudinal history once
            another result is stored.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 sm:px-5">
      <div className="flex items-end gap-2">
        {[22, 34, 26, 42, 30].map((h, i) => (
          <div key={i} className="w-4 rounded-sm bg-zinc-900 sm:w-5" style={{ height: h }} />
        ))}
      </div>
      <p className={`mt-4 ${visualEyebrow}`}>No programming marks yet</p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
        Approved benchmarks become current marks after coach activation. Nothing is estimated from
        race overall or invented for empty slots.
      </p>
      <Link
        href="/athlete/performance-testing"
        className="mt-4 inline-flex text-xs font-semibold text-yellow-400/90 hover:text-yellow-300"
      >
        Open performance testing →
      </Link>
    </div>
  );
}
