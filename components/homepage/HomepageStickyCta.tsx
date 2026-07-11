"use client";

import { useEffect, useState } from "react";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { PrimaryCta } from "./homepageUi";

export function HomepageStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/95 px-4 py-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Quick action"
    >
      <PrimaryCta href={FREE_WEEK_HYROX_URL} className="w-full min-h-[48px]">
        Start My Free Training Week
      </PrimaryCta>
    </div>
  );
}
