/**
 * Public marketing / checkout URLs used across the app.
 * Whop checkout matches CTAs on `/community`.
 */

/** New Hybrid365 community checkout (£39.99/month). Override via NEXT_PUBLIC_WHOP_JOIN_URL. */
const COMMUNITY_WHOP_CHECKOUT_URL = "https://whop.com/checkout/plan_BRqCqZPUywY6u";

/** Legacy £29.99 Whop plan — existing members; webhooks grant access regardless of plan id. */
export const WHOP_LEGACY_COMMUNITY_PLAN_ID = "plan_JdjBrs5xpfpoN";

export const WHOP_COMMUNITY_PLAN_ID = "plan_BRqCqZPUywY6u";

/** Optional override: NEXT_PUBLIC_WHOP_JOIN_URL in env */
export function getWhopJoinUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHOP_JOIN_URL?.trim();
  return fromEnv || COMMUNITY_WHOP_CHECKOUT_URL;
}
