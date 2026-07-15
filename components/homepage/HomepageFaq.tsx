"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FAQ_COPY, FAQ_ITEMS } from "@/app/lib/homepage/faq";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageFaq() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <HomepageSection id="faq" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{FAQ_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {FAQ_COPY.headline}
        </HomepageHeading>
      </div>

      <ul className="mx-auto mt-10 max-w-3xl space-y-2 lg:mx-0">
        {FAQ_ITEMS.map((item) => {
          const open = openId === item.id;
          return (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className="text-sm font-bold text-white sm:text-base">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[#f4d23c] transition",
                    open && "rotate-45"
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {open ? (
                <p className="border-t border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-white/55">
                  {item.answer}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </HomepageSection>
  );
}
