# Staging Supabase and environments

Design only. Do not create a Supabase project or point local development at production as part of reading this doc.

## Problem

Local `.env.local` has been aimed at the production Supabase project. A migration, seed, or service-role script run from a laptop can change real athletes.

## Target

One Supabase project for production and a second project for staging.

| | Production | Staging |
| --- | --- | --- |
| Name | Existing production project | `hybrid365-staging` |
| Used by | Vercel Production for `plan.hybrid-365.com` | Local default and Vercel Preview |
| Service role | Vercel Production and an explicit production command | Local and Preview only |
| Data | Real athletes | Disposable demo athletes |

Staging must be able to reset. Production must not.

## Env files

Next.js loads `.env.local` for `next dev` and `next build` on a laptop. Vercel injects its own env per environment. Do not commit any of these files.

| File | Committed | Purpose |
| --- | --- | --- |
| `.env.example` | Yes | Names only |
| `.env.local` | No | Staging URL and staging service role. This is the default local file. |
| `.env.production.local` | No | Production URL and keys. Used only with an explicit command. Next will also load this for `next build` locally, so do not keep it in the worktree during ordinary builds. |
| Vercel Production | Hosted | Production project |
| Vercel Preview | Hosted | Staging project |

Recommended local habit:

1. `.env.local` points at staging.
2. Production keys live in a password manager or Vercel, not in the default local file.
3. A script refuses to seed or migrate unless `HYROX_ENV=staging` and `NEXT_PUBLIC_SUPABASE_URL` is not the production URL.

`scripts/staging/print-hyrox-demo-athletes.mjs` implements that refusal. It prints fixtures and does not write.

## Cutover

1. Create the empty staging project in the Supabase dashboard.
2. Apply the existing migration chain there, still skipping `017` until readiness is intentionally staged.
3. Copy `.env.example` to `.env.local` and fill staging values.
4. Remove the production service role from the shared local env file.
5. Set Vercel Preview to the staging project. Leave Vercel Production unchanged.
6. Run `npm run qa:hyrox-all` against code, then a staging smoke (create athlete, publish, log, delete).

Until step 4, treat every local service-role script as production-dangerous.

## What staging is for

- Apply and roll back migrations
- Test RLS with a real staging auth user
- Accept an application and confirm a fake payment
- Onboard, submit tests, publish a programme, log a session, submit a check-in
- Reset demo athletes

## What staging is not for

- Production smoke of `plan.hybrid-365.com`
- Copying the production database into a laptop file
- Trying a destructive SQL statement "just to see"

## Demo athletes

Deterministic fixtures live in `scripts/staging/hyrox-demo-athletes.json`.

| Id | Profile | 5K | Ergs | HYROX |
| --- | --- | --- | --- | --- |
| `demo-developing` | Newer athlete | about 22:00 | Moderate | No active race anchor |
| `demo-competitive` | Racing athlete | about 18:00 | Strong | Sub-65 history, not auto-active |
| `demo-high-performance` | High performance | about 16:30 | Strong | Sub-60 history, not auto-active |

Each fixture should eventually include an auth user, assessment, testing rows, benchmark history, one published week, logged sessions with RPE, a check-in, and one race result. Active anchors are explicit. The race is history unless the fixture says `active: true`.

Seed only after staging exists, `HYROX_ENV=staging`, and the URL guard passes. Do not seed production.

## Variable classes

See `.env.example`.

- **Public:** `NEXT_PUBLIC_*`. These ship to the browser. Never put a service role here.
- **Server-only:** service role, signing secret, coach email lists, webhook secrets.
- **Staging-specific:** staging URL, staging anon key, staging service role, `HYROX_ENV=staging`.
- **Production-specific:** production URL and keys, stored in Vercel Production. `HYROX_ENV=production`.
