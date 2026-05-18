# Supabase Auth custom SMTP setup

Magic-link login emails are sent by **Supabase Auth**, not by this Next.js app. If testers see **“email rate limit exceeded”**, that is almost always Supabase’s **built-in email quota** (very low on the free tier) or per-user rate limits — not a bug in the Hybrid365 app.

**Fix for production:** configure **custom SMTP** in the Supabase project so Auth sends through Resend, SendGrid, Mailgun, or your own relay.

---

## What users see in the app

The login page (`/login`) maps rate-limit errors to friendly copy and shows:

> If you request multiple sign-in links, use the latest one. If you hit a limit, wait a few minutes or message Kieran.

No app code change is required after SMTP is configured — only Supabase dashboard settings.

---

## Prerequisites

1. A verified **sending domain** (e.g. `mail.hybrid365.com` or your root domain with SPF/DKIM).
2. An account with **Resend**, **SendGrid**, or **Mailgun**.
3. **Supabase project** → **Project Settings** → **Auth** (or **Authentication** → **Email**).

---

## Supabase dashboard (all providers)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email** (or **Project Settings** → **Auth** → **SMTP Settings**).
3. Enable **Custom SMTP**.
4. Set:
   - **Sender email** — e.g. `noreply@yourdomain.com` (must be allowed by your provider).
   - **Sender name** — e.g. `Hybrid365`.
5. Paste host, port, username, and password from your provider (below).
6. **Save**, then send a test magic link from `/login`.

Also check:

| Setting | Recommendation |
|--------|----------------|
| **Site URL** | Production URL, e.g. `https://app.hybrid365.com` |
| **Redirect URLs** | Include `https://app.hybrid365.com/auth/callback` (and local `http://localhost:3000/auth/callback` for dev) |
| **Email rate limits** | Under Auth → Rate limits; custom SMTP raises practical limits but keep abuse protection |

---

## Option A — Resend (recommended for simplicity)

1. [resend.com](https://resend.com) → add and verify domain → create **API key** with “Sending” access.
2. Resend SMTP (see [Resend SMTP docs](https://resend.com/docs/send-with-smtp)):

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | `resend` |
| Password | Your Resend API key (`re_…`) |

3. In Supabase custom SMTP, use the same values; sender must use your verified domain.

**Tips:** Resend’s free tier is usually enough for early member volume; monitor the Resend dashboard for bounces and daily sends.

---

## Option B — SendGrid

1. [sendgrid.com](https://sendgrid.com) → **Settings** → **Sender Authentication** → verify domain.
2. **Settings** → **API Keys** → create key with **Mail Send** permission (or use SMTP credentials from **Settings** → **Integration** → **SMTP**).

Typical SMTP:

| Field | Value |
|-------|--------|
| Host | `smtp.sendgrid.net` |
| Port | `587` |
| Username | `apikey` |
| Password | Your SendGrid API key |

Sender email must match an authenticated sender/domain.

---

## Option C — Mailgun

1. [mailgun.com](https://www.mailgun.com) → add domain → complete DNS (SPF, DKIM).
2. **Sending** → **Domain settings** → **SMTP credentials**.

Typical SMTP:

| Field | Value |
|-------|--------|
| Host | `smtp.mailgun.org` (or region-specific host shown in dashboard) |
| Port | `587` |
| Username | Postmaster SMTP login from Mailgun |
| Password | SMTP password from Mailgun |

Use the “from” address on that verified domain in Supabase.

---

## DNS checklist (all providers)

For deliverability and to avoid spam folders:

- **SPF** — include your provider’s include mechanism.
- **DKIM** — add the CNAME/TXT records the provider gives you.
- **DMARC** (optional but recommended) — `v=DMARC1; p=none` initially, tighten later.

Wait for DNS propagation (often 15 minutes–48 hours) before heavy testing.

---

## Rate limits: built-in vs custom SMTP

| Source | Typical behaviour |
|--------|-------------------|
| Supabase default email | Very low hourly/daily caps; easy to hit in user testing with repeated magic-link clicks. |
| Custom SMTP | Sending limits follow **your provider’s** plan; Supabase may still apply Auth rate limits per IP/email for abuse prevention. |

If limits persist **after** custom SMTP:

1. Confirm custom SMTP is **enabled** and a test email sends from Supabase (Auth logs).
2. Check Supabase **Authentication** → **Rate limits** (sign-in / email).
3. Ask users to use only the **latest** magic link and wait a few minutes between requests.

---

## Local development

- Magic links still go through Supabase Auth; custom SMTP applies to the linked project (staging vs prod).
- Keep `http://localhost:3000/auth/callback` in **Redirect URLs**.
- Optional: use a separate Supabase project or Resend test mode for dev to avoid burning production quota.

---

## Verification checklist

- [ ] Custom SMTP enabled and saved in Supabase  
- [ ] Sender domain verified at provider  
- [ ] Site URL + redirect URLs include production and `/auth/callback`  
- [ ] Magic link received in inbox (not spam) from `/login`  
- [ ] Expired/used link shows friendly message on `/login?error=auth`  
- [ ] Repeated requests show rate-limit copy (not raw API JSON)  

---

## Support copy (for members)

You can reuse this in email or WhatsApp:

> We email you a one-time sign-in link — no password. Open the **most recent** email if you clicked “Email me a link” more than once. If you see a rate limit message, wait a few minutes and try again, or message Kieran.

---

## Magic link “expired or already used” (after SMTP is configured)

Common causes:

1. **Email link scanners** (Microsoft Safe Links, Gmail) open the URL once and consume the one-time code.
2. **Session cookies not attached** on redirect from `/auth/callback` (fixed in app — cookies must be written on the redirect response).
3. **PKCE**: link opened in a different browser/device than where the link was requested.
4. **Redirect URL mismatch** — `emailRedirectTo` must exactly match an entry in Supabase **Redirect URLs**.

**App mitigations:**

- `/auth/callback` writes auth cookies onto the redirect response (Supabase SSR pattern).
- Fallback `verifyOtp` via `token_hash` when Supabase sends that flow.
- Login **Email code** tab — enter the 6-digit code from the same email (scanners do not burn codes as easily).

**Env (production):**

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Must match Supabase **Site URL** and redirect allowlist.

**Supabase email template:** include `{{ .Token }}` so the 6-digit code appears in magic-link emails.

---

## Related app files

| File | Role |
|------|------|
| `app/(auth)/login/page.tsx` | Magic link + email code login |
| `app/lib/authLoginErrors.ts` | User-facing error copy |
| `app/lib/authRedirectUrl.ts` | `emailRedirectTo` and callback origin |
| `app/(auth)/auth/callback/route.ts` | PKCE exchange + `token_hash` fallback |
| `app/lib/supabase/client.ts` | PKCE enabled; `detectSessionInUrl: false` |
