"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { COMMUNITY_UPGRADE_URL } from "@/app/lib/freePlanDashboard";

type Hybrid75UpgradeCtaProps = {
  variant?: "default" | "compact" | "success";
  title?: string;
  className?: string;
};

export default function Hybrid75UpgradeCta({
  variant = "default",
  title,
  className = "",
}: Hybrid75UpgradeCtaProps) {
  const heading =
    title ??
    (variant === "success"
      ? "Want the best result from the challenge?"
      : "Ready for the full programme?");

  const body =
    variant === "success"
      ? "The free challenge gives you the start. The full Hybrid365 programme gives you a complete 16-week personalised plan, progression, coaching support, accountability and a team around you to help you become the fittest, fastest and strongest you've ever been."
      : "Your free week is the starting point. The full Hybrid365 programme gives you 16 weeks of personalised structure, progression, tracking, coaching support and team accountability.";

  if (variant === "compact") {
    return (
      <div
        className={`rounded-2xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-5 ${className}`}
      >
        <p className="text-sm font-semibold text-white">{heading}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
        <a
          href={COMMUNITY_UPGRADE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F4D23C] px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
        >
          Unlock the Full 16-Week Programme
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border border-[#F4D23C]/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 text-center md:p-8 ${className}`}
    >
      <Sparkles className="mx-auto h-8 w-8 text-[#F4D23C]" />
      <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">{heading}</h3>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">{body}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={COMMUNITY_UPGRADE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F4D23C] px-6 py-3.5 text-sm font-bold text-black transition hover:opacity-90"
        >
          Unlock the Full 16-Week Programme
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/community"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Join the Hybrid365 Community
        </Link>
      </div>
    </div>
  );
}
