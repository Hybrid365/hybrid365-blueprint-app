/** Stripe Payment Link URLs for Hyrox Team checkout. */

export type HyroxStripeCheckoutLinks = {
  monthly: string;
  upfront: string;
  sixteenWeek: string;
};

const ENV_KEYS = {
  monthly: [
    "NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL",
    "STRIPE_HYROX_MONTHLY_URL",
    "NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_LINK",
  ],
  upfront: [
    "NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL",
    "NEXT_PUBLIC_STRIPE_HYROX_12_WEEK_URL",
    "STRIPE_HYROX_UPFRONT_URL",
    "NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_LINK",
  ],
  sixteenWeek: [
    "NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL",
    "STRIPE_HYROX_16_WEEK_URL",
    "NEXT_PUBLIC_STRIPE_HYROX_16WEEK_URL",
    "NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_LINK",
  ],
} as const;

function readEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Read at request time on the server (works when Vercel env is set per deployment). */
export function readHyroxStripeCheckoutLinks(): HyroxStripeCheckoutLinks {
  return {
    monthly: readEnv(ENV_KEYS.monthly),
    upfront: readEnv(ENV_KEYS.upfront),
    sixteenWeek: readEnv(ENV_KEYS.sixteenWeek),
  };
}

/** @deprecated Prefer readHyroxStripeCheckoutLinks() in Server Components. */
export const HYROX_STRIPE_CHECKOUT_LINKS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL ?? "",
  upfront: process.env.NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL ?? "",
  sixteenWeek: process.env.NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL ?? "",
} as const;

export function getHyroxStripeCheckoutUrls(): HyroxStripeCheckoutLinks {
  return readHyroxStripeCheckoutLinks();
}

export function isHyroxCheckoutConfigured(links: HyroxStripeCheckoutLinks): boolean {
  return Boolean(links.monthly || links.upfront || links.sixteenWeek);
}
