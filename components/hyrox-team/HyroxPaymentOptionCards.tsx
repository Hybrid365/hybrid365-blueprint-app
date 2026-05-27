import Link from "next/link";
import { HyroxCard } from "@/components/hyrox-team/HyroxTeamUi";
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
];

const btnPrimary =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center font-black tracking-[-0.02em] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90";

const btnUnavailable =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-6 text-center text-sm font-bold text-zinc-500";

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
      <div>
        <span className={btnUnavailable} role="button" aria-disabled>
          Currently unavailable
        </span>
        {isDev ? (
          <p className="m-0 mt-2 text-center text-[11px] leading-snug text-zinc-500">
            Set{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">{envKey}</code> to enable
            checkout.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
      {label}
    </Link>
  );
}

type HyroxPaymentOptionCardsProps = {
  links?: HyroxStripeCheckoutLinks;
  className?: string;
};

export function HyroxPaymentOptionCards({ links: linksProp, className = "" }: HyroxPaymentOptionCardsProps) {
  const links = linksProp ?? readHyroxStripeCheckoutLinks();
  const showMonthly = links.monthly || process.env.NODE_ENV === "development";
  const showUpfront = links.upfront || process.env.NODE_ENV === "development";
  const showSixteen = links.sixteenWeek || process.env.NODE_ENV === "development";

  return (
    <div className={`grid gap-5 lg:grid-cols-3 ${className}`}>
      {showMonthly ? (
        <HyroxCard className="flex flex-col">
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
            Founding athlete rate
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">Pay monthly</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">
            £150<span className="text-lg font-semibold text-zinc-500">/month</span>
          </p>
          <p className="m-0 mt-2 text-sm font-semibold text-zinc-200">{MONTHLY_COMMITMENT_HEADLINE}</p>
          <p className="m-0 mt-1 text-sm text-zinc-500">3 months · total £450</p>
          <p className="m-0 mt-4 text-xs leading-relaxed text-zinc-400">{MONTHLY_COMMITMENT_DETAIL}</p>
          <p className="m-0 mt-3 text-xs text-zinc-500">
            Best for: athletes who want to spread cost while committing to the full 3-month runway.
          </p>
          <ul className="m-0 mt-4 flex-1 space-y-1.5 border-t border-zinc-800/80 pt-4">
            {MONTHLY_COMMITMENT_INVESTMENT.map((item) => (
              <li key={item} className="text-[11px] leading-snug text-zinc-500">
                · {item}
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-2.5 border-t border-zinc-800/80 pt-5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <PayCta
              href={links.monthly}
              label="Pay monthly — £150/month"
              envKey="NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL"
            />
          </div>
        </HyroxCard>
      ) : null}

      {showUpfront ? (
        <HyroxCard className="relative flex flex-col">
          <span className="absolute right-5 top-5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
            Save £51 vs monthly
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">12-week upfront</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">£399</p>
          <p className="m-0 mt-2 text-sm font-semibold text-emerald-300/90">{UPFRONT_COMMITMENT_LINE}</p>
          <p className="m-0 mt-1 text-sm text-zinc-500">One payment · full 12-week Hyrox Team block</p>
          <p className="m-0 mt-4 text-xs text-zinc-500">
            Best for: athletes ready to commit upfront for the full Team 001 block.
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <PayCta
              href={links.upfront}
              label="Pay upfront — £399 · 12 weeks"
              envKey="NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL"
            />
          </div>
        </HyroxCard>
      ) : null}

      {showSixteen ? (
        <HyroxCard highlight className="relative flex flex-col">
          <span className="absolute right-5 top-5 rounded-full border border-[#f4d23c]/40 bg-[#f4d23c]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#f4d23c]">
            {BUILD_16WEEK_VALUE_BADGE}
          </span>
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
            Extended 1-1 build
          </span>
          <p className="m-0 mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">16-week build</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">£549</p>
          <p className="m-0 mt-2 text-sm font-semibold text-[#f4d23c]/90">{BUILD_16WEEK_VALUE_LINE}</p>
          <p className="m-0 mt-3 text-xs leading-relaxed text-zinc-400">{BUILD_16WEEK_COMMITMENT_LINE}</p>
          <p className="m-0 mt-4 text-xs text-zinc-500">
            Best for: athletes further from race day who want the fullest base-to-race arc.
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {CORE_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-zinc-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
                {b}
              </li>
            ))}
            <li className="flex gap-2 text-sm text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]" />
              16-week base-to-race progression
            </li>
          </ul>
          <div className="mt-8">
            <PayCta
              href={links.sixteenWeek}
              label="Pay upfront — £549 · 16 weeks"
              envKey="NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL"
            />
          </div>
        </HyroxCard>
      ) : null}
    </div>
  );
}
