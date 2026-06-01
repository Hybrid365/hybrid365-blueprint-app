/**
 * Paid community /login — Supabase signInWithOtp helpers.
 *
 * Supabase uses ONE "Magic Link" email template for signInWithOtp:
 * - If the template contains {{ .ConfirmationURL }} → user gets a clickable link.
 * - If the template contains {{ .Token }} (and no link) → user gets a 6-digit code.
 * - Passing options.emailRedirectTo tends to produce link-style emails.
 *
 * Dashboard: Authentication → Email Templates → Magic Link
 * Recommended for code login: OTP-only body with {{ .Token }}, no {{ .ConfirmationURL }}.
 *
 * Brand-new users: if "Confirm email" is enabled, Supabase may send a separate
 * Confirm signup email (also a link, often using Site URL). Disable confirm email
 * for passwordless OTP, or fix that template's redirect in Supabase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEmailRedirectTo, emailHintForAuthLog } from "@/app/lib/authRedirectUrl";

export type CommunityLoginDelivery = "email_code" | "magic_link";

export type CommunityLoginOtpLogContext = {
  delivery: CommunityLoginDelivery;
  /** UI handler name for debugging */
  handler: "sendLoginCode" | "sendMagicLink" | "sendOtpEmail";
  email: string;
  next: string;
  shouldCreateUser: boolean;
  emailRedirectTo: string | null;
  otpVerifyExpected: boolean;
};

export function logCommunityLoginOtpRequest(ctx: CommunityLoginOtpLogContext): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[community login] signInWithOtp request", {
    mode: ctx.delivery,
    functionCalled: ctx.handler,
    email: emailHintForAuthLog(ctx.email),
    next: ctx.next,
    shouldCreateUser: ctx.shouldCreateUser,
    emailRedirectTo: ctx.emailRedirectTo,
    otpVerifyExpected: ctx.otpVerifyExpected,
  });
}

/**
 * Primary paid login: request a numeric code (no magic-link redirect param).
 */
export function requestCommunityLoginCodeEmail(
  supabase: SupabaseClient,
  email: string,
  next: string
) {
  logCommunityLoginOtpRequest({
    delivery: "email_code",
    handler: "sendLoginCode",
    email,
    next,
    shouldCreateUser: true,
    emailRedirectTo: null,
    otpVerifyExpected: true,
  });

  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      // Do not set emailRedirectTo — keeps delivery on OTP/code template, not link.
    },
  });
}

/**
 * Optional magic-link path on /login (explicit user choice).
 */
export function requestCommunityMagicLinkEmail(
  supabase: SupabaseClient,
  email: string,
  next: string
) {
  const emailRedirectTo = buildEmailRedirectTo(next);
  logCommunityLoginOtpRequest({
    delivery: "magic_link",
    handler: "sendMagicLink",
    email,
    next,
    shouldCreateUser: true,
    emailRedirectTo,
    otpVerifyExpected: false,
  });

  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo,
    },
  });
}
