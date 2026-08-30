"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  getCaseStudiesForSurface,
  type AthleteCaseStudy,
  type ProofCardMetric,
} from "@/app/lib/proof";
import {
  START_HYBRID_PROOF_METRIC_IDS,
  START_HYBRID_PROOF_NOTES,
  START_HYBRID_STEP3,
} from "@/app/lib/start/startCopy";
import { cn } from "@/lib/utils";

function visibleMetrics(study: AthleteCaseStudy): ProofCardMetric[] {
  const allowed = START_HYBRID_PROOF_METRIC_IDS[study.id];
  if (!allowed) return study.cardMetrics.slice(0, 3);
  const byId = new Map(study.cardMetrics.map((metric) => [metric.id, metric]));
  return allowed
    .map((id) => byId.get(id))
    .filter((metric): metric is ProofCardMetric => Boolean(metric));
}

function AthleteCard({ study }: { study: AthleteCaseStudy }) {
  const portrait = study.portrait;
  const note = START_HYBRID_PROOF_NOTES[study.id] ?? study.cardNote;
  const metrics = visibleMetrics(study);

  return (
    <article className="flex h-[148px] overflow-hidden rounded-md border border-white/[0.12] bg-[#0a0a0a] sm:h-[152px]">
      <div
        className="relative w-[34%] shrink-0 bg-[#111]"
        data-temporary-announcement={portrait.temporaryAnnouncement ? "true" : undefined}
      >
        <Image
          src={portrait.src}
          alt={portrait.alt}
          fill
          className={cn("object-cover", portrait.objectPosition ?? "object-top")}
          sizes="(max-width: 1024px) 34vw, 140px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-1.5 sm:px-3">
        <h3 className="text-[12px] font-black uppercase leading-none tracking-[-0.03em] text-white">
          {study.athlete.firstName}
        </h3>
        <div className="mt-1 space-y-0.5">
          {metrics.map((metric) => (
            <p key={metric.id} className="leading-none">
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#f4d23c]">
                {metric.label}
              </span>
              <span className="ml-1.5 text-[12px] font-black tabular-nums tracking-tight text-white">
                {metric.value}
              </span>
              {metric.previous ? (
                <span className="ml-1 text-[8px] font-medium text-white/32">
                  {metric.previous} before
                </span>
              ) : null}
            </p>
          ))}
        </div>
        <p className="mt-1 text-[10px] leading-snug text-white/48">{note}</p>
      </div>
    </article>
  );
}

export function StartHybridProofSlider() {
  const copy = START_HYBRID_STEP3;
  const studies = getCaseStudiesForSurface("hybrid-performance");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-athlete-card]");
    const amount = (card?.offsetWidth ?? 280) + 10;
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
            {copy.resultsEyebrow}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/40">{copy.resultsSupporting}</p>
        </div>
        <div className="hidden shrink-0 gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous athletes"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-white/35"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
              <path d="M10.2 2.4 4.6 8l5.6 5.6 1.2-1.2L7 8l4.4-4.4z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next athletes"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 text-white/35"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
              <path d="M5.8 2.4 4.6 3.6 9 8l-4.4 4.4 1.2 1.2L11.4 8z" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Hybrid365 athlete results"
        className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 [scrollbar-width:none] outline-none [&::-webkit-scrollbar]:hidden lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {studies.map((study) => (
          <div
            key={study.id}
            data-athlete-card
            className="w-[82%] shrink-0 snap-start snap-always sm:w-[48%] lg:w-[calc((100%-1rem)/3)]"
          >
            <AthleteCard study={study} />
          </div>
        ))}
      </div>
    </section>
  );
}
