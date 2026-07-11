"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FREE_WEEK_HYROX_URL,
  HOMEPAGE_NAV,
} from "@/app/lib/homepage/homepageLinks";
import { PrimaryCta } from "./homepageUi";

const NAV_LINKS = [
  { href: HOMEPAGE_NAV.method, label: "Method" },
  { href: HOMEPAGE_NAV.results, label: "Results" },
  { href: HOMEPAGE_NAV.team, label: "Team" },
  { href: HOMEPAGE_NAV.community, label: "Community" },
] as const;

export function HomepageNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-white/[0.08] bg-[#050505]/92 backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-[68px] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.12em] text-white"
        >
          Hybrid<span className="text-[#f4d23c]">365</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={HOMEPAGE_NAV.login}
            className="text-xs font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80"
          >
            Login
          </Link>
          <PrimaryCta href={FREE_WEEK_HYROX_URL} className="min-h-[40px] px-5 text-xs">
            Start Free Week
          </PrimaryCta>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <PrimaryCta href={FREE_WEEK_HYROX_URL} className="min-h-[36px] px-4 text-[10px]">
            Free Week
          </PrimaryCta>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white"
          >
            <span className="sr-only">Menu</span>
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#050505] px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-white/80"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={HOMEPAGE_NAV.login}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-white/50"
            >
              Login
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
