"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  COACHING_SYSTEM_COPY,
  COACHING_SYSTEM_VIEWS,
} from "@/app/lib/homepage/coachingSystem";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageProduct() {
  const [activeId, setActiveId] = useState(COACHING_SYSTEM_VIEWS[0].id);
  const active =
    COACHING_SYSTEM_VIEWS.find((v) => v.id === activeId) ?? COACHING_SYSTEM_VIEWS[0];
  const screen = getPhoneScreen(active.screenId);

  return (
    <HomepageSection id="system" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>{COACHING_SYSTEM_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {COACHING_SYSTEM_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{COACHING_SYSTEM_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
          {COACHING_SYSTEM_COPY.body}
        </p>
        <p className="mt-3 text-sm text-white/40">{COACHING_SYSTEM_COPY.note}</p>
      </div>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_minmax(200px,280px)] lg:gap-12">
        <div>
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
            Swipe views →
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {COACHING_SYSTEM_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveId(view.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition",
                  activeId === view.id
                    ? "border-[#f4d23c] bg-[#f4d23c] text-[#050505]"
                    : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
                )}
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
              {active.label}
            </p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              {active.question}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">{screen.description}</p>
          </div>
        </div>

        <div className="mx-auto w-[min(58vw,240px)] lg:w-full">
          <HomepagePhoneVisual screen={screen} size="md" fillContainer priority={false} />
        </div>
      </div>
    </HomepageSection>
  );
}
