/** Stripe Payment Link URLs — set in `.env.local` (NEXT_PUBLIC_* inlined at build). */
export const HYROX_STRIPE_CHECKOUT_LINKS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_HYROX_MONTHLY_URL ?? "",
  upfront: process.env.NEXT_PUBLIC_STRIPE_HYROX_UPFRONT_URL ?? "",
  sixteenWeek: process.env.NEXT_PUBLIC_STRIPE_HYROX_16_WEEK_URL ?? "",
} as const;

export function getHyroxStripeCheckoutUrls() {
  return HYROX_STRIPE_CHECKOUT_LINKS;
}
