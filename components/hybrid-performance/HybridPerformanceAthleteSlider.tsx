"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  getCaseStudiesForSurface,
  type AthleteCaseStudy,
  type ProofCardMetric,
} from "@/app/lib/proof";
import { HYBRID_PERFORMANCE_RESULTS } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { cn } from "@/lib/utils";

const PRIMARY_METRIC_IDS = new Set([
  "rae-5k",
  "ricci-5k",
  "ricci-hybrid",
  "bobby-5k",
]);

const MUTED_METRIC_IDS = new Set(["ricci-ski", "ricci-row"]);

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous athletes" : "Next athletes"}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 text-white/35 transition hover:border-white/30 hover:text-white/70"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
        {direction === "prev" ? (
          <path d="M10.2 2.4 4.6 8l5.6 5.6 1.2-1.2L7 8l4.4-4.4z" />
        ) : (
          <path d="M5.8 2.4 4.6 3.6 9 8l-4.4 4.4 1.2 1.2L11.4 8z" />
        )}
      </svg>
    </button>
  );
}

function orderedMetrics(study: AthleteCaseStudy): ProofCardMetric[] {
  if (study.id !== "ricci-lee-jarvis") return study.cardMetrics;
  const byId = new Map(study.cardMetrics.map((metric) => [metric.id, metric]));
  return ["ricci-5k", "ricci-hybrid", "ricci-ski", "ricci-row"]
    .map((id) => byId.get(id))
    .filter((metric): metric is ProofCardMetric => Boolean(metric));
}

function MetricRows({ metrics }: { metrics: ProofCardMetric[] }) {
  const muted = metrics.filter((metric) => MUTED_METRIC_IDS.has(metric.id));
  const rest = metrics.filter((metric) => !MUTED_METRIC_IDS.has(metric.id));

  return (
    <div className="mt-1.5 space-y-1">
      {rest.map((metric) => {
        const isPrimary = PRIMARY_METRIC_IDS.has(metric.id);
        return (
          <div key={metric.id} className="min-w-0">
            {metric.previous ? (
              <p className="leading-none">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#f4d23c]">
                  {metric.label}
                </span>
                <span className="ml-1.5 text-[15px] font-black tabular-nums tracking-tight text-white">
                  {metric.value}
                </span>
                <span className="mt-0.5 block text-[9px] font-medium tracking-wide text-white/32">
                  {metric.previous} before coaching
                </span>
              </p>
            ) : (
              <p
                className={cn(
                  "leading-none",
                  isPrimary ? "text-[12px]" : "text-[11px]"
                )}
              >
                <span
                  className={cn(
                    "font-bold uppercase tracking-[0.12em]",
                    isPrimary ? "text-[#f4d23c]" : "text-[#f4d23c]/70"
                  )}
                >
                  {metric.label}
                </span>
                <span
                  className={cn(
                    "ml-1.5 font-black tabular-nums tracking-tight text-white",
                    isPrimary ? "text-[14px]" : "text-[12px]"
                  )}
                >
                  {metric.value}
                </span>
                {metric.note ? (
                  <span className="ml-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/38">
                    {metric.note}
                  </span>
                ) : null}
              </p>
            )}
          </div>
        );
      })}
      {muted.length ? (
        <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/32">
          {muted.map((metric, index) => (
            <span key={metric.id}>
              {index > 0 ? <span className="mx-1.5 text-white/18">·</span> : null}
              {metric.label} {metric.value}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function AthleteResultCard({ study }: { study: AthleteCaseStudy }) {
  const portrait = study.portrait;
  const metrics = orderedMetrics(study);

  return (
    <article className="flex h-[214px] overflow-hidden rounded-md border border-white/[0.12] bg-[#070707] sm:h-[228px] lg:h-[236px]">
      <div
        className="relative w-[48%] shrink-0 bg-[#0a0a0a]"
        data-temporary-announcement={portrait.temporaryAnnouncement ? "true" : undefined}
      >
        <Image
          src={portrait.src}
          alt={portrait.alt}
          fill
          className={cn("object-cover", portrait.objectPosition ?? "object-top")}
          sizes="(max-width: 1024px) 42vw, 190px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-3 py-2.5 sm:px-3.5 sm:py-3">
        <h3 className="text-[15px] font-black uppercase leading-none tracking-[-0.03em] text-white sm:text-base">
          {study.athlete.firstName}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-white/58">
          {study.cardNote}
        </p>
        <MetricRows metrics={metrics} />
        {study.identityCallout ? (
          <p className="mt-auto pt-1.5 text-[8px] font-normal leading-snug tracking-[0.01em] text-white/28">
            {study.identityCallout}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function HybridPerformanceAthleteSlider() {
  const copy = HYBRID_PERFORMANCE_RESULTS;
  const studies = getCaseStudiesForSurface("hybrid-performance");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-athlete-card]");
    const amount = (card?.offsetWidth ?? 280) + 12;
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  return (
    <section
      id="results"
      className="scroll-mt-[72px] overflow-x-hidden border-t border-white/[0.05] bg-[#070707] px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-black uppercase leading-[0.9] tracking-[-0.045em] text-white text-[clamp(1.4rem,4vw,2.05rem)]">
              {copy.headline}
            </h2>
            <p className="mt-1 text-sm text-white/45">{copy.supporting}</p>
          </div>
          <div className="hidden shrink-0 gap-1.5 sm:flex">
            <ArrowButton direction="prev" onClick={() => scrollByCard(-1)} />
            <ArrowButton direction="next" onClick={() => scrollByCard(1)} />
          </div>
        </div>

        <div
          ref={scrollerRef}
          tabIndex={0}
          role="region"
          aria-label="Athlete results"
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 [scrollbar-width:none] outline-none [&::-webkit-scrollbar]:hidden lg:mx-0 lg:scroll-px-0 lg:px-0"
        >
          {studies.map((study) => (
            <div
              key={study.id}
              data-athlete-card
              className="w-[83%] shrink-0 snap-start snap-always sm:w-[48%] lg:w-[calc((100%-1.5rem)/3)]"
            >
              <AthleteResultCard study={study} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
