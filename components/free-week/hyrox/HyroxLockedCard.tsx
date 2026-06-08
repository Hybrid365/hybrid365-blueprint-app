import { Lock } from "lucide-react";
import Link from "next/link";

type HyroxLockedCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  badge?: string;
  communityUrl?: string;
  teamUrl?: string;
  showCta?: boolean;
  className?: string;
};

export function HyroxLockedCard({
  title,
  description,
  children,
  badge = "Locked",
  communityUrl,
  teamUrl,
  showCta = false,
  className = "",
}: HyroxLockedCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/40 via-transparent to-yellow-400/[0.03] pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-700 bg-black/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            <Lock className="h-3 w-3" />
            {badge}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
        {children ? <div className="mt-4 opacity-75">{children}</div> : null}
        {showCta && communityUrl ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={communityUrl}
              className="inline-flex rounded-lg bg-yellow-400/90 px-3 py-1.5 text-xs font-bold text-black hover:bg-yellow-300"
            >
              Unlock with HYROX Community
            </Link>
            {teamUrl ? (
              <Link
                href={teamUrl}
                className="inline-flex rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-400"
              >
                Coach-reviewed in HYROX Team
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HyroxInlineUpgradeStrip({
  communityUrl,
  teamUrl,
  compact = false,
}: {
  communityUrl: string;
  teamUrl: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-yellow-400/25 bg-gradient-to-r from-yellow-400/10 via-zinc-950 to-zinc-950 ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
        Week 1 unlocked · Full block locked
      </p>
      <p className={`mt-2 font-semibold text-white ${compact ? "text-sm" : "text-lg"}`}>
        Want the full 12-week HYROX progression?
      </p>
      {!compact ? (
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          The full block, check-ins, tracking and progression unlock inside Hybrid365 — join the HYROX
          community or apply for HYROX Team coaching.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={communityUrl}
          className="inline-flex items-center rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-yellow-300"
        >
          Unlock HYROX Track
        </Link>
        <Link
          href={teamUrl}
          className="inline-flex items-center rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white hover:border-zinc-400"
        >
          Apply for 1-1 coaching
        </Link>
      </div>
    </div>
  );
}
