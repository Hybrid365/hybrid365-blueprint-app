import Link from "next/link";
import { AthletePortalNavLink } from "./AthletePortalNavLink";
import { athleteProgrammePrefetchDisabled } from "./athleteNav";
import { Lock } from "lucide-react";

/** Shared layout rhythm for athlete portal pages */
export const athletePageStack = "space-y-8";

export const athleteCard =
  "rounded-2xl border border-zinc-800/90 bg-zinc-900/80 shadow-sm shadow-black/20";
export const athleteCardPadding = "p-5 sm:p-6";
export const athleteCardHighlight =
  "rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-zinc-900/95 to-zinc-950 shadow-sm shadow-yellow-950/10";

/** Hover + focus for clickable cards (hub, resources, benchmarks) */
export const athleteCardInteractive =
  "rounded-2xl border border-zinc-800/90 bg-zinc-900/80 shadow-sm shadow-black/20 transition duration-200 hover:border-yellow-500/35 hover:bg-zinc-900 hover:shadow-md hover:shadow-yellow-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/50";

export const btnPrimaryClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-sm shadow-yellow-950/20 transition hover:bg-yellow-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnSecondaryClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnGhostClass =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800/80 hover:text-white";

export const eyebrowClass =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90";

export function PageContent({
  children,
  width = "default",
  className = "",
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "full";
  className?: string;
}) {
  const maxW =
    width === "wide" ? "max-w-6xl" : width === "full" ? "" : "max-w-5xl mx-auto";
  return <div className={`${maxW} ${athletePageStack} pb-2 ${className}`.trim()}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-zinc-800/80 pb-6 sm:pb-8">
      {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${eyebrow ? "mt-2" : ""}`}>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SnapshotPanel({
  title,
  href,
  linkLabel = "View all →",
  children,
  className = "",
  highlight,
}: {
  title: string;
  href: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  const shell = highlight ? athleteCardHighlight : athleteCard;
  return (
    <section className={`${shell} ${athleteCardPadding} ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {href.startsWith("/athlete/") ? (
          <AthletePortalNavLink
            href={href}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-400/10 hover:text-yellow-300"
          >
            {linkLabel}
          </AthletePortalNavLink>
        ) : (
          <Link
            href={href}
            prefetch={athleteProgrammePrefetchDisabled(href) ? false : undefined}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-400/10 hover:text-yellow-300"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function BtnPrimary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${btnPrimaryClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${btnSecondaryClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function BtnLinkSecondary({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href.startsWith("/athlete/")) {
    return (
      <AthletePortalNavLink href={href} className={`${btnSecondaryClass} ${className}`}>
        {children}
      </AthletePortalNavLink>
    );
  }

  return (
    <Link
      href={href}
      prefetch={athleteProgrammePrefetchDisabled(href) ? false : undefined}
      className={`${btnSecondaryClass} ${className}`}
    >
      {children}
    </Link>
  );
}

export function LinkCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-semibold text-yellow-400 transition hover:text-yellow-300 ${className}`}
    >
      {children}
    </Link>
  );
}

export function ClickableCard({
  children,
  className = "",
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const classes = `${athleteCardInteractive} ${athleteCardPadding} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={`block text-left ${classes}`}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`w-full text-left ${classes}`}>
      {children}
    </button>
  );
}

export function LockedBanner({
  title = "Unlocks closer to race week",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-yellow-500/25 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-400/5 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-400/5">
            <Lock className="h-5 w-5 text-yellow-400/70" />
          </div>
          <div>
            <p className="font-semibold text-white">{title}</p>
            {description ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p> : null}
          </div>
        </div>
        <span className="shrink-0 self-start rounded-full border border-zinc-600/80 bg-zinc-800/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400 sm:self-center">
          Coming soon
        </span>
      </div>
    </div>
  );
}

export function ProgrammeWaitingCard() {
  return (
    <div className={`${athleteCard} ${athleteCardPadding} mx-auto max-w-md text-center`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
        <Lock className="h-5 w-5 text-amber-300/80" />
      </div>
      <p className="text-lg font-semibold text-white">Your programme is not live yet</p>
      <p className="mx-auto mt-2 text-sm leading-relaxed text-zinc-500">
        Your coach is building your first block. You&apos;ll see Week 1–4 sessions here once your coach publishes your
        programme.
      </p>
      <Link href="/athlete/dashboard" className={`${btnPrimaryClass} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}

/** Dev-only: shown when exploring the portal without a linked athlete or published programme. */
export function PreviewGateCard() {
  return (
    <div className={`${athleteCard} ${athleteCardPadding} mx-auto max-w-md text-center`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950">
        <Lock className="h-5 w-5 text-zinc-500" />
      </div>
      <p className="text-lg font-semibold text-white">Dev mock preview</p>
      <p className="mx-auto mt-2 text-sm leading-relaxed text-zinc-500">
        In development, turn on{" "}
        <span className="font-medium text-yellow-400">Programme live (mock preview)</span> on the dashboard to explore
        sample UI. Real athletes use data from their published programme only.
      </p>
      <Link href="/athlete/dashboard" className={`${btnPrimaryClass} mt-6`}>
        Go to dashboard
      </Link>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warn" | "neutral";
}) {
  const tones = {
    success: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
    warn: "border-amber-500/35 bg-amber-500/15 text-amber-300",
    neutral: "border-zinc-600 bg-zinc-800 text-zinc-300",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function MethodologyChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-1 text-[10px] font-medium text-zinc-300">
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-zinc-950 ${className}`}>
      <div
        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export const ATHLETE_PAGE_META = {
  programme: {
    eyebrow: "Programme",
    title: "Your training week",
    subtitle: "Full schedule, session detail and logging for the current block.",
  },
  progress: {
    eyebrow: "Progress",
    title: "Training load & performance",
    subtitle: "Volume, benchmarks and coach interpretation for your Hyrox build.",
  },
  benchmarks: {
    eyebrow: "Benchmarks",
    title: "Performance testing",
    subtitle: "Baseline, latest results and targets across Hyrox markers.",
  },
  checkin: {
    eyebrow: "Check-in",
    title: "Weekly coach feedback",
    subtitle: "Recovery, load and availability — submitted for coach review.",
  },
  coachNotes: {
    eyebrow: "Coach notes",
    title: "Your coaching direction",
    subtitle: "Personal focus, adjustments and why this week is built this way.",
  },
  racePrep: {
    eyebrow: "Race prep",
    title: "Race execution",
    subtitle: "Pacing, fuelling, taper and race-day checklist.",
  },
  resources: {
    eyebrow: "Resources",
    title: "Education library",
    subtitle: "Technique guides and race-week protocols from Hybrid365.",
  },
} as const;
