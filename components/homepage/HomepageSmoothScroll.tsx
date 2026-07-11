"use client";

import { useEffect } from "react";

/** Applies smooth scroll only while the homepage is mounted — no global CSS side effects. */
export function HomepageSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    document.documentElement.classList.add("scroll-smooth");
    return () => {
      document.documentElement.classList.remove("scroll-smooth");
    };
  }, []);

  return null;
}
