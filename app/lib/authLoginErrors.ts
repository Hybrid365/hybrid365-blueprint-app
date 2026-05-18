/**
 * User-facing copy for magic-link login errors (Supabase Auth).
 * Does not change auth behaviour — maps API messages to clearer UI text.
 */

export const MAGIC_LINK_HELP_COPY =
  "If you request multiple sign-in links, use the latest one. Older links may expire. If you hit a limit, wait a few minutes or message Kieran.";

export const MAGIC_LINK_SUCCESS_COPY =
  "Check your email for the sign-in link. Use the most recent email if you requested more than one.";

export const OTP_ERROR_HEADLINE_DEFAULT = "We couldn’t send the sign-in link. Please try again.";

export const EMAIL_CODE_SUCCESS_COPY =
  "If your email includes a 6-digit code, enter it below. You can also use the magic link in the same email.";

export const CALLBACK_ERROR_HEADLINE = "That sign-in link didn’t work";

export function mapCallbackAuthError(reason: string | null | undefined): string {
  const r = (reason ?? "").toLowerCase();
  if (
    r.includes("otp_expired") ||
    r.includes("expired") ||
    r.includes("already been used") ||
    r.includes("invalid_grant")
  ) {
    return "That sign-in link expired or was already used. Request a fresh link below, or use the email code option if your message includes one.";
  }
  if (r.includes("pkce") || r.includes("code verifier")) {
    return "Open the link in the same browser where you requested it, or use the 6-digit email code instead.";
  }
  if (r.includes("missing_code")) {
    return "The sign-in link was incomplete. Request a new link or use the email code option.";
  }
  return "That sign-in link expired or was already used. Request a fresh link below.";
}

type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

export function mapSignInOtpError(error: AuthErrorLike): {
  headline: string;
  detail: string;
} {
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    error.status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    code.includes("over_email_send_rate_limit")
  ) {
    return {
      headline: "Email rate limit reached",
      detail:
        "Too many sign-in emails were sent in a short time. Wait a few minutes before trying again, or message Kieran if you still can’t sign in.",
    };
  }

  if (msg.includes("invalid email") || msg.includes("unable to validate")) {
    return {
      headline: OTP_ERROR_HEADLINE_DEFAULT,
      detail: "Enter a valid email address and try again.",
    };
  }

  if (msg.includes("signup") && msg.includes("disabled")) {
    return {
      headline: OTP_ERROR_HEADLINE_DEFAULT,
      detail:
        "This email isn’t registered for access yet. Use the same address you used on Whop, or contact support.",
    };
  }

  if (msg.includes("smtp") || msg.includes("email provider")) {
    return {
      headline: OTP_ERROR_HEADLINE_DEFAULT,
      detail:
        "We couldn’t send the email right now. Try again in a few minutes or message Kieran if it keeps failing.",
    };
  }

  return {
    headline: OTP_ERROR_HEADLINE_DEFAULT,
    detail: error.message?.trim() || "Something went wrong. Please try again.",
  };
}

export function mapSignInOtpThrownError(err: Error): {
  headline: string;
  detail: string;
} {
  const msg = err.message.toLowerCase();
  if (msg.includes("timed out") || msg.includes("timeout")) {
    return {
      headline: OTP_ERROR_HEADLINE_DEFAULT,
      detail: "The request timed out. Check your connection and try again.",
    };
  }
  return mapSignInOtpError({ message: err.message });
}
