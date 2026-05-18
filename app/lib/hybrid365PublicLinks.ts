/**
 * Public marketing / checkout URLs used across the app.
 * Whop checkout matches CTAs on `/community`.
 */

const COMMUNITY_WHOP_CHECKOUT_URL = "https://whop.com/checkout/plan_JdjBrs5xpfpoN";

/** Optional override: NEXT_PUBLIC_WHOP_JOIN_URL in env */
export function getWhopJoinUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHOP_JOIN_URL?.trim();
  return fromEnv || COMMUNITY_WHOP_CHECKOUT_URL;
}
