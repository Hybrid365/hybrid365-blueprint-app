"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  SCREENING_COPY,
  SCREENING_STEPS,
} from "@/app/lib/homepage/screeningFlow";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageScreeningFlow() {
  const [active, setActive] = useState(0);
  const step = SCREENING_STEPS[active];

  return (
    <HomepageSection id="screening" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{SCREENING_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {SCREENING_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{SCREENING_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
          {SCREENING_COPY.body}
        </p>
        <p className="mt-3 text-sm font-medium text-white/40">{SCREENING_COPY.note}</p>
      </div>

      {/* Desktop connected flow */}
      <div className="mt-14 hidden lg:block">
        <ol className="relative flex items-start justify-between gap-2">
          <div
            className="pointer-events-none absolute left-[6%] right-[6%] top-5 h-px bg-gradient-to-r from-white/20 via-[#f4d23c]/40 to-white/20"
            aria-hidden
          />
          {SCREENING_STEPS.map((s, i) => (
            <li key={s.number} className="relative z-10 flex w-[18%] flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-black transition",
                  active === i
                    ? "border-[#f4d23c] bg-[#f4d23c] text-[#050505]"
                    : "border-white/20 bg-[#0a0a0a] text-white/60 hover:border-white/40"
                )}
                aria-pressed={active === i}
              >
                {s.number}
              </button>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                {s.title}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#0a0a0a] p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
            Step {step.number}
          </p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
            {step.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-white/50">{step.microcopy}</p>
          <ul className="mt-6 grid grid-cols-2 gap-2 xl:grid-cols-4">
            {step.items.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-white/75"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <ol className="mt-12 space-y-6 lg:hidden">
        {SCREENING_STEPS.map((s) => (
          <li key={s.number} className="relative border-l border-[#f4d23c]/35 pl-5">
            <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#f4d23c]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
              {s.number}
            </p>
            <h3 className="mt-1 text-base font-black uppercase tracking-tight text-white">
              {s.title}
            </h3>
            <p className="mt-2 text-sm text-white/50">{s.microcopy}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-center text-lg font-black uppercase tracking-tight text-white sm:text-xl lg:text-left">
        {SCREENING_COPY.close[0]}{" "}
        <span className="text-[#f4d23c]">{SCREENING_COPY.close[1]}</span>
      </p>
    </HomepageSection>
  );
}
