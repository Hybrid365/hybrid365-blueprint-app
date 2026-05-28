import Link from "next/link";
import type { ReactNode } from "react";
import {
  readHyroxStripeCheckoutLinks,
  type HyroxStripeCheckoutLinks,
} from "@/components/hyrox-team/hyroxStripeCheckout";
import {
  BUILD_16WEEK_COMMITMENT_LINE,
  BUILD_16WEEK_VALUE_BADGE,
  BUILD_16WEEK_VALUE_LINE,
  MONTHLY_COMMITMENT_DETAIL,
  MONTHLY_COMMITMENT_HEADLINE,
  MONTHLY_COMMITMENT_INVESTMENT,
  UPFRONT_COMMITMENT_LINE,
} from "@/components/hyrox-team/hyroxTeamOfferCopy";
import { Check } from "lucide-react";

const CORE_BENEFITS = [
  "12-week Hyrox Team block",
  "Personalised Hyrox programming",
  "Weekly check-ins & coach feedback",
  "Hybrid365 athlete dashboard",
  "Baseline testing & benchmark tracking",
] as const;

const btnPrimary =
  "inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center text-base font-black tracking-[-0.02em] text-[#050505] shadow-[0_8px_32px_rgba(244,210,60,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f7da55] sm:min-h-[60px] sm:text-lg";

const btnUnavailable =
  "inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-6 text-center text-base font-bold text-zinc-500 sm:min-h-[60px]";

function PayCta({
  href,
  label,
  envKey,
}: {
  href: string;
  label: string;
  envKey: string;
}) {
  const isDev = process.env.NODE_ENV === "development";

  if (!href) {
    return (
      <div className="mt-auto pt-8">
        <span className={btnUnavailable} role="button" aria-disabled>
          Currently unavailable
        </span>
        {isDev ? (
          <p className="m-0 mt-2 text-center text-[11px] leading-snug text-zinc-500">
            Set{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">{envKey}</code> to enable checkout.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-auto pt-8">
      <Link href={href} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
        {label}
      </Link>
    </div>
  );
}

function PremiumBadge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "gold" | "emerald" | "highlight";
  className?: string;
}) {
  const tones = {
    muted: "border-zinc-600/80 bg-zinc-900 text-zinc-300",
    gold: "border-[#f4d23c]/40 bg-[#f4d23c]/10 text-[#f4d23c]",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    highlight: "border-[#f4d23c]/50 bg-[#f4d23c]/15 text-[#f4d23c]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] sm:text-[11px] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function PremiumPricingCard({
  children,
  highlight = false,
  className = "",
}: {
  children: ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-[28px] border-2 p-7 sm:p-9 ${
        highlight
          ? "border-[#f4d23c]/55 bg-gradient-to-b from-[#f4d23c]/[0.09] via-black to-black shadow-[0_0_0_1px_rgba(244,210,60,0.12),0_24px_64px_rgba(0,0,0,0.55)]"
          : "border-[#f4d23c]/30 bg-black shadow-[0_20px_56px_rgba(0,0,0,0.45)]"
      } ${className}`}
    >
      {children}
    </article>
  );
}

function OptionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 mt-5 text-sm font-black uppercase tracking-[0.2em] text-[#f4d23c] sm:text-base">{children}</p>
  );
}

function PriceDisplay({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 mt-3 text-[clamp(2.75rem,10vw,4rem)] font-black leading-[0.95] tracking-[-0.04em] text-white">
      {children}
    </p>
  );
}

function CardDivider() {
  return <hr className="my-6 border-0 border-t border-zinc-800/90" />;
}

function IncludedList({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 space-y-3">
      {items.map((b) => (
        <li key={b} className="flex gap-3 text-sm leading-snug text-zinc-200 sm:text-[15px]">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c] sm:h-5 sm:w-5" strokeWidth={2.5} />
          {b}
        </li>
      ))}
    </ul>
  );
}

function InvestmentBullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 space-y-2">
      {items.map((item) => (
        <li key={item} className="text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          · {item}
        </li>
      ))}
    </ul>
  );
}

type HyroxPaymentOptionCardsProps = {
  links?: HyroxStripeCheckoutLinks;
  className?: string;
};

export function HyroxPaymentOptionCards({ links: linksProp, className = "" }: HyroxPaymentOptionCardsProps) {
  const links = linksProp ?? readHyroxStripeCheckoutLinks();
  const showMonthly = true;
  const showUpfront = true;
  const showSixteen = true;

  return (
    <div className={`mx-auto flex w-full max-w-2xl flex-col gap-6 sm:max-w-3xl sm:gap-8 ${className}`}>
      {showMonthly ? (
        <PremiumPricingCard>
          <PremiumBadge tone="muted">Founding athlete rate</PremiumBadge>
          <OptionTitle>Pay monthly</OptionTitle>
          <PriceDisplay>
            £150<span className="text-[0.45em] font-bold tracking-normal text-zinc-500">/month</span>
          </PriceDisplay>
          <p className="m-0 mt-3 text-base font-bold text-zinc-100 sm:text-lg">{MONTHLY_COMMITMENT_HEADLINE}</p>
          <p className="m-0 mt-1.5 text-sm text-zinc-400 sm:text-base">3 months · total £450</p>
          <p className="m-0 mt-5 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">{MONTHLY_COMMITMENT_DETAIL}</p>
          <CardDivider />
          <InvestmentBullets items={MONTHLY_COMMITMENT_INVESTMENT} />
          <CardDivider />
          <IncludedList items={CORE_BENEFITS} />
          <PayCta
            href={links.monthly}
            label="Pay monthly — £150/month"
            envKey="NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL"
          />
        </PremiumPricingCard>
      ) : null}

      {showUpfront ? (
        <PremiumPricingCard className="relative">
          <div className="flex justify-end">
            <PremiumBadge tone="emerald">Save £51 vs monthly</PremiumBadge>
          </div>
          <OptionTitle>12-week upfront</OptionTitle>
          <PriceDisplay>£399</PriceDisplay>
          <p className="m-0 mt-3 text-base font-bold text-emerald-300/95 sm:text-lg">{UPFRONT_COMMITMENT_LINE}</p>
          <p className="m-0 mt-1.5 text-sm text-zinc-400 sm:text-base">One payment · full 12-week Hyrox Team block</p>
          <CardDivider />
          <IncludedList items={CORE_BENEFITS} />
          <PayCta
            href={links.upfront}
            label="Pay upfront — £399 · 12 weeks"
            envKey="NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL"
          />
        </PremiumPricingCard>
      ) : null}

      {showSixteen ? (
        <PremiumPricingCard highlight>
          <div className="flex flex-wrap items-center gap-2.5">
            <PremiumBadge tone="muted">Extended 1-1 build</PremiumBadge>
            <PremiumBadge tone="highlight">{BUILD_16WEEK_VALUE_BADGE}</PremiumBadge>
          </div>
          <OptionTitle>16-week build</OptionTitle>
          <PriceDisplay>£549</PriceDisplay>
          <p className="m-0 mt-3 text-base font-bold leading-snug text-[#f4d23c]/95 sm:text-lg">{BUILD_16WEEK_VALUE_LINE}</p>
          <p className="m-0 mt-4 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">{BUILD_16WEEK_COMMITMENT_LINE}</p>
          <CardDivider />
          <IncludedList
            items={[...CORE_BENEFITS, "16-week base-to-race progression"]}
          />
          <PayCta
            href={links.sixteenWeek}
            label="Pay upfront — £549 · 16 weeks"
            envKey="NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL"
          />
        </PremiumPricingCard>
      ) : null}
    </div>
  );
}
