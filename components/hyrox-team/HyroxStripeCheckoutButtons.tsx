"use client";

import Link from "next/link";
import type { HyroxStripeCheckoutLinks } from "./hyroxStripeCheckout";
import { HYROX_STRIPE_CHECKOUT_LINKS } from "./hyroxStripeCheckout";

const btnPrimary =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center font-black tracking-[-0.02em] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90";

const btnUnavailable =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-6 text-center text-sm font-bold text-zinc-500";

const ENV_NAMES = {
  monthly: "NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL",
  upfront: "NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL",
  sixteenWeek: "NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL",
} as const;

type Tier = keyof HyroxStripeCheckoutLinks;

function resolveHref(tier: Tier, links?: HyroxStripeCheckoutLinks): string {
  const fromProp = links?.[tier]?.trim();
  if (fromProp) return fromProp;
  return HYROX_STRIPE_CHECKOUT_LINKS[tier].trim();
}

export function HyroxStripePayButton({
  tier,
  className = "",
  children,
  href: hrefOverride,
  links,
}: {
  tier: Tier;
  className?: string;
  children: React.ReactNode;
  href?: string;
  links?: HyroxStripeCheckoutLinks;
}) {
  const href = (hrefOverride ?? resolveHref(tier, links)).trim();
  const envName = ENV_NAMES[tier];
  const isDev = process.env.NODE_ENV === "development";

  if (!href) {
    return (
      <div className={className}>
        <span className={btnUnavailable} role="button" aria-disabled>
          Currently unavailable
        </span>
        {isDev ? (
          <p className="m-0 mt-2 text-center text-[11px] leading-snug text-zinc-500">
            Set{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">{envName}</code> to enable
            checkout.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${btnPrimary} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Compact row of CTAs — prefer HyroxPaymentOptionCards on marketing pages. */
export function HyroxStripePriceOptions({
  monthlyLabel = "Pay monthly — £150/month",
  upfrontLabel = "Pay upfront — £399 · 12 weeks",
  sixteenWeekLabel = "Pay upfront — £549 · 16 weeks",
  className = "",
  links,
}: {
  monthlyLabel?: string;
  upfrontLabel?: string;
  sixteenWeekLabel?: string;
  className?: string;
  links?: HyroxStripeCheckoutLinks;
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}>
      <HyroxStripePayButton tier="monthly" className="min-w-[220px] flex-1" links={links}>
        {monthlyLabel}
      </HyroxStripePayButton>
      <HyroxStripePayButton tier="upfront" className="min-w-[220px] flex-1" links={links}>
        {upfrontLabel}
      </HyroxStripePayButton>
      <HyroxStripePayButton tier="sixteenWeek" className="min-w-[220px] flex-1" links={links}>
        {sixteenWeekLabel}
      </HyroxStripePayButton>
    </div>
  );
}
