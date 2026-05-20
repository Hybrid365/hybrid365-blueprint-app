"use client";

import Link from "next/link";
import { HYROX_STRIPE_CHECKOUT_LINKS } from "./hyroxStripeCheckout";

const btnPrimary =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center font-black tracking-[-0.02em] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90";

const btnDisabled = `${btnPrimary} pointer-events-none cursor-not-allowed opacity-45`;

const ENV_NAMES = {
  monthly: "NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL",
  upfront: "NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL",
  sixteenWeek: "NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL",
} as const;

function MissingEnvHint({ name }: { name: string }) {
  return (
    <p className="m-0 mt-2 text-center text-[11px] leading-snug text-zinc-500">
      Set <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">{name}</code> to enable checkout.
    </p>
  );
}

type Tier = keyof typeof HYROX_STRIPE_CHECKOUT_LINKS;

export function HyroxStripePayButton({
  tier,
  className = "",
  children,
}: {
  tier: Tier;
  className?: string;
  children: React.ReactNode;
}) {
  const href = HYROX_STRIPE_CHECKOUT_LINKS[tier].trim();
  const envName = ENV_NAMES[tier];

  if (!href) {
    return (
      <div className={className}>
        <span className={btnDisabled} role="button" aria-disabled>
          {children}
        </span>
        <MissingEnvHint name={envName} />
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

/** Accepted page + payment page: monthly, 12-week upfront, 16-week build */
export function HyroxStripePriceOptions({
  monthlyLabel = "Pay monthly — £150/month",
  upfrontLabel = "Pay upfront — £399 · 12 weeks",
  sixteenWeekLabel = "Pay upfront — £549 · 16 weeks",
  className = "",
}: {
  monthlyLabel?: string;
  upfrontLabel?: string;
  sixteenWeekLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}>
      <HyroxStripePayButton tier="monthly" className="min-w-[220px] flex-1">
        {monthlyLabel}
      </HyroxStripePayButton>
      <HyroxStripePayButton tier="upfront" className="min-w-[220px] flex-1">
        {upfrontLabel}
      </HyroxStripePayButton>
      <HyroxStripePayButton tier="sixteenWeek" className="min-w-[220px] flex-1">
        {sixteenWeekLabel}
      </HyroxStripePayButton>
    </div>
  );
}
